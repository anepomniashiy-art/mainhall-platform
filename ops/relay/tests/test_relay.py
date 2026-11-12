import http.client
import json
import statistics
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import Relay
from worker import Worker


class RelayTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.tokens = {'gpt': 'a' * 32, 'claude-code': 'b' * 32, 'claude': 'c' * 32, 'owner': 'd' * 32}
        self.server = Relay(('127.0.0.1', 0), Path(self.tmp.name) / 'queue.sqlite', self.tokens)
        self.port = self.server.server_port
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.tmp.cleanup()

    def post(self, path, data, agent='gpt', token=None):
        c = http.client.HTTPConnection('127.0.0.1', self.port, timeout=2)
        c.request('POST', path, json.dumps(data), {'Authorization': 'Bearer ' + (token or self.tokens[agent]), 'Content-Type': 'application/json'})
        r = c.getresponse()
        result = r.status, json.loads(r.read())
        c.close()
        return result

    def stream(self, agent, after=0):
        c = http.client.HTTPConnection('127.0.0.1', self.port, timeout=2)
        c.request('GET', '/events?after=' + str(after), headers={'Authorization': 'Bearer ' + self.tokens[agent]})
        r = c.getresponse()
        self.assertEqual(r.status, 200)
        r.readline(); r.readline()
        return c, r

    def event(self, r):
        while True:
            line = r.readline()
            if line.startswith(b'data: '):
                payload = json.loads(line[6:])
                r.readline()
                return payload

    def test_push_latency_without_polling(self):
        c, stream = self.stream('claude-code')
        samples = []
        try:
            for i in range(30):
                start = time.perf_counter()
                status, sent = self.post('/messages', {'to': 'claude-code', 'request_id': str(i), 'text': 'task'})
                self.assertEqual(status, 202)
                event = self.event(stream)
                samples.append((time.perf_counter() - start) * 1000)
                self.assertEqual(event['id'], sent['id'])
            p95 = sorted(samples)[int(len(samples) * .95) - 1]
            print(f'LOCAL transport n=30 p50={statistics.median(samples):.2f}ms p95={p95:.2f}ms max={max(samples):.2f}ms')
            self.assertLess(p95, 1000)
        finally:
            stream.close(); c.close()

    def test_auth_idempotency_and_recipient_ack(self):
        data = {'to': 'claude-code', 'request_id': 'unique', 'text': 'private task'}
        self.assertEqual(self.post('/messages', data, token='wrong')[0], 401)
        _, first = self.post('/messages', data)
        _, duplicate = self.post('/messages', data)
        self.assertEqual(first['id'], duplicate['id'])
        self.assertTrue(duplicate['duplicate'])
        self.assertEqual(self.post('/messages', dict(data, text='changed'))[0], 409)
        self.assertFalse(self.post('/ack', {'id': first['id']}, agent='claude')[1]['acknowledged'])
        self.assertTrue(self.post('/ack', {'id': first['id']}, agent='claude-code')[1]['acknowledged'])

    def test_durable_replay_and_recipient_isolation(self):
        self.post('/messages', {'to': 'claude', 'request_id': 'other', 'text': 'not for code'})
        _, sent = self.post('/messages', {'to': 'claude-code', 'request_id': 'offline', 'text': 'durable'})
        # A separate instance opens the same persisted database: no in-memory queue dependency.
        other = Relay(('127.0.0.1', 0), self.server.database, self.tokens)
        with other.db() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM messages').fetchone()[0], 2)
        other.server_close()
        c, stream = self.stream('claude-code')
        try:
            event = self.event(stream)
            self.assertEqual(event['id'], sent['id'])
            self.assertEqual(event['text'], 'durable')
        finally:
            stream.close(); c.close()

    def test_bounded_gpt_to_claude_roundtrip_and_replay(self):
        calls = []
        def responder(agent, task):
            calls.append(agent)
            return agent + ' verified test reply'
        url = f'http://127.0.0.1:{self.port}'
        gpt = Worker('gpt', url, self.tokens['gpt'], str(Path(self.tmp.name) / 'gpt.sqlite'), responder)
        claude = Worker('claude', url, self.tokens['claude'], str(Path(self.tmp.name) / 'claude.sqlite'), responder)
        cg, sg = self.stream('gpt'); cc, sc = self.stream('claude'); co, so = self.stream('owner')
        try:
            self.post('/messages', {'to': 'gpt', 'request_id': 'chain', 'text': json.dumps({'kind':'request','task':'test','next':'claude','correlation_id':'chain'})}, agent='owner')
            first = self.event(sg)
            gpt.handle(first)
            # Replay cannot cause another model call or duplicate durable result.
            gpt.handle(first)
            second = self.event(sc)
            self.assertEqual(second['sender'], 'gpt')
            claude.handle(second)
            result = json.loads(self.event(so)['text'])
            self.assertEqual(result['agent'], 'claude')
            self.assertEqual(result['upstream']['agent'], 'gpt')
            self.assertEqual(result['correlation_id'], 'chain')
            self.assertEqual(calls, ['gpt', 'claude'])
        finally:
            for c,s in [(cg,sg),(cc,sc),(co,so)]:s.close();c.close()


if __name__ == '__main__':
    unittest.main()
