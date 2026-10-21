"""Persistent API-agent consumer. No shell execution; bounded one-hop delegation."""
import json
import os
import sqlite3
import time
import urllib.request
import urllib.error


def api_reply(agent, task):
    system = 'You are an internal MAINHALL technical coordinator. Be concise and factual. Never invent execution, access or successful checks. Never disclose credentials. Review the supplied task and evidence only. You have no shell tools in this API call.'
    if agent == 'gpt':
        url = 'https://api.openai.com/v1/chat/completions'
        headers = {'Authorization': 'Bearer ' + os.environ['OPENAI_API_KEY']}
        payload = {'model': os.environ.get('OPENAI_MODEL', 'gpt-4o'), 'max_tokens': 600, 'messages': [{'role': 'system', 'content': system}, {'role': 'user', 'content': task}]}
    else:
        url = 'https://api.anthropic.com/v1/messages'
        headers = {'x-api-key': os.environ['ANTHROPIC_API_KEY'], 'anthropic-version': '2023-06-01'}
        payload = {'model': os.environ.get('ANTHROPIC_MODEL', 'claude-haiku-4-5'), 'max_tokens': 600, 'system': system, 'messages': [{'role': 'user', 'content': task}]}
    request = urllib.request.Request(url, json.dumps(payload).encode(), headers | {'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = json.load(response)
    if agent == 'gpt':
        return data['choices'][0]['message']['content']
    return '\n'.join(p['text'] for p in data['content'] if p.get('type') == 'text')


class Worker:
    def __init__(self, name, url, token, database, responder=api_reply):
        if name not in ('gpt', 'claude'):
            raise ValueError('Unknown worker')
        self.name, self.url, self.token, self.database = name, url.rstrip('/'), token, database
        self.responder = responder
        with sqlite3.connect(database) as db:
            db.execute('CREATE TABLE IF NOT EXISTS completed (message_id INTEGER PRIMARY KEY, result TEXT NOT NULL)')

    def post(self, path, data):
        request = urllib.request.Request(self.url + path, json.dumps(data).encode(), {'Authorization': 'Bearer ' + self.token, 'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.load(response)

    def handle(self, event):
        mid = event['id']
        try:
            data = json.loads(event['text'])
        except ValueError:
            self.post('/ack', {'id': mid})
            return
        if not isinstance(data, dict) or data.get('kind') != 'request' or type(data.get('hop', 0)) is not int or not 0 <= data.get('hop', 0) <= 1:
            self.post('/ack', {'id': mid})
            return
        with sqlite3.connect(self.database) as db:
            saved = db.execute('SELECT result FROM completed WHERE message_id=?', (mid,)).fetchone()
        if saved:
            output = json.loads(saved[0])
        else:
            started = time.perf_counter()
            try:
                answer = self.responder(self.name, str(data.get('task', ''))[:24000])
                failure = None
            except Exception as error:
                answer = ''
                failure = {'type': type(error).__name__, 'http_status': getattr(error, 'code', None)}
            target = data.get('next') if data.get('hop', 0) == 0 else None
            if target == self.name or target not in ('gpt', 'claude'):
                target = None
            correlation = str(data.get('correlation_id', mid))[:128]
            if target and not failure:
                text = {'kind': 'request', 'hop': 1, 'reply_to': event['sender'], 'correlation_id': correlation, 'task': 'Review this technical coordination answer. State any errors or missing evidence.\nOriginal task: ' + str(data.get('task', ''))[:12000] + '\nAnswer from ' + self.name + ': ' + answer, 'upstream': {'agent': self.name, 'answer': answer}}
                recipient = target
            else:
                recipient = data.get('reply_to', event['sender'])
                if recipient not in ('gpt', 'claude', 'claude-code', 'owner'):
                    recipient = event['sender']
                text = {'kind': 'error' if failure else 'response', 'agent': self.name, 'correlation_id': correlation, 'answer': answer, 'error': failure, 'model_seconds': round(time.perf_counter() - started, 3), 'upstream': data.get('upstream')}
            output = {'to': recipient, 'request_id': f'{self.name}-result-{mid}', 'text': json.dumps(text)}
            with sqlite3.connect(self.database) as db:
                db.execute('INSERT OR REPLACE INTO completed(message_id,result) VALUES(?,?)', (mid, json.dumps(output)))
        self.post('/messages', output)
        self.post('/ack', {'id': mid})

    def run(self):
        # Only reconnect after a broken stream; idle task delivery has no polling timer.
        for attempt in range(8):
            try:
                request = urllib.request.Request(self.url + '/events?after=0', headers={'Authorization': 'Bearer ' + self.token})
                with urllib.request.urlopen(request, timeout=90) as response:
                    for line in response:
                        if line.startswith(b'data: '):
                            self.handle(json.loads(line[6:]))
            except Exception as error:
                # Type only: provider exceptions can contain request details.
                print('worker reconnect:', self.name, type(error).__name__, flush=True)
                time.sleep(min(2 ** attempt, 30))
        raise RuntimeError('Reconnect budget exhausted')


if __name__ == '__main__':
    Worker(os.environ['MAINHALL_AGENT_NAME'], os.environ.get('MAINHALL_RELAY_URL', 'http://127.0.0.1:8881'), os.environ['MAINHALL_AGENT_TOKEN'], os.environ['MAINHALL_WORKER_DB']).run()
