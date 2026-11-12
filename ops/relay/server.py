"""Authenticated, durable agent message relay. Transport only; does not execute tasks."""
import hmac
from contextlib import contextmanager
import json
import os
import sqlite3
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs


class Relay(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, database, tokens):
        if not tokens or any(len(v) < 32 for v in tokens.values()):
            raise ValueError('Each agent needs its own token of at least 32 characters')
        if len(set(tokens.values())) != len(tokens):
            raise ValueError('Tokens must be unique per agent')
        self.database, self.tokens = str(database), tokens
        self.changed = threading.Condition()
        with self.db() as db:
            db.execute('PRAGMA journal_mode=WAL')
            db.execute('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, sender TEXT NOT NULL, recipient TEXT NOT NULL, request_id TEXT NOT NULL, text TEXT NOT NULL, created_ns INTEGER NOT NULL, acknowledged_ns INTEGER, UNIQUE(sender,request_id))')
        super().__init__(address, Handler)

    @contextmanager
    def db(self):
        db = sqlite3.connect(self.database, timeout=5)
        try:
            with db:
                yield db
        finally:
            db.close()


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, *_):
        pass  # Do not log tokens, message text or query strings.

    def identity(self):
        auth = self.headers.get('Authorization', '')
        for name, token in self.server.tokens.items():
            if hmac.compare_digest(auth, 'Bearer ' + token):
                return name
        return None

    def respond(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlsplit(self.path)
        if path.path == '/health':
            return self.respond(200, {'status': 'ok', 'transport': 'sse'})
        agent = self.identity()
        if not agent:
            return self.respond(401, {'error': 'unauthorized'})
        if path.path != '/events':
            return self.respond(404, {'error': 'not_found'})
        try:
            after = int(parse_qs(path.query).get('after', [self.headers.get('Last-Event-ID', '0')])[0])
            if after < 0:
                raise ValueError()
        except ValueError:
            return self.respond(400, {'error': 'invalid_cursor'})
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Accel-Buffering', 'no')
        self.end_headers()
        try:
            self.wfile.write(b': connected\n\n')
            self.wfile.flush()
            while True:
                # Query and wait share the producer lock: no lost notification race.
                with self.server.changed:
                    with self.server.db() as db:
                        rows = db.execute('SELECT id,sender,request_id,text,created_ns FROM messages WHERE recipient=? AND id>? AND acknowledged_ns IS NULL ORDER BY id LIMIT 100', (agent, after)).fetchall()
                    if not rows:
                        self.server.changed.wait(15)  # Keepalive, not a polling interval.
                if not rows:
                    self.wfile.write(b': keepalive\n\n')
                    self.wfile.flush()
                    continue
                for mid, sender, request_id, text, created_ns in rows:
                    payload = json.dumps(dict(id=mid, sender=sender, request_id=request_id, text=text, created_ns=created_ns))
                    self.wfile.write(f'id: {mid}\ndata: {payload}\n\n'.encode())
                    self.wfile.flush()
                    after = mid
        except (BrokenPipeError, ConnectionResetError, TimeoutError):
            pass

    def do_POST(self):
        agent = self.identity()
        if not agent:
            return self.respond(401, {'error': 'unauthorized'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 262144:
                return self.respond(413, {'error': 'invalid_size'})
            self.connection.settimeout(10)
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError()
        except (ValueError, UnicodeDecodeError, TimeoutError):
            return self.respond(400, {'error': 'invalid_json'})
        if self.path == '/messages':
            recipient, request_id, text = data.get('to'), data.get('request_id'), data.get('text')
            if recipient not in self.server.tokens or not isinstance(request_id, str) or not 1 <= len(request_id) <= 128 or not isinstance(text, str) or not text:
                return self.respond(400, {'error': 'invalid_message'})
            with self.server.changed:
                with self.server.db() as db:
                    old = db.execute('SELECT id,recipient,text FROM messages WHERE sender=? AND request_id=?', (agent, request_id)).fetchone()
                    if old and (old[1] != recipient or old[2] != text):
                        return self.respond(409, {'error': 'idempotency_conflict'})
                    if old:
                        mid = old[0]
                    else:
                        mid = db.execute('INSERT INTO messages(sender,recipient,request_id,text,created_ns) VALUES(?,?,?,?,?)', (agent, recipient, request_id, text, time.time_ns())).lastrowid
                self.server.changed.notify_all()
            return self.respond(202, {'id': mid, 'duplicate': bool(old)})
        if self.path == '/ack':
            if type(data.get('id')) is not int:
                return self.respond(400, {'error': 'invalid_id'})
            with self.server.db() as db:
                updated = db.execute('UPDATE messages SET acknowledged_ns=? WHERE id=? AND recipient=? AND acknowledged_ns IS NULL', (time.time_ns(), data['id'], agent)).rowcount
            return self.respond(200, {'acknowledged': bool(updated)})
        return self.respond(404, {'error': 'not_found'})


if __name__ == '__main__':
    tokens = json.loads(os.environ['MAINHALL_AGENT_TOKENS'])
    server = Relay(('127.0.0.1', int(os.environ.get('MAINHALL_RELAY_PORT', '8881'))), os.environ['MAINHALL_RELAY_DB'], tokens)
    server.serve_forever()
