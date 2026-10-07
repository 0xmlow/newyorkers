#!/usr/bin/env python3
"""Minimal Chrome DevTools Protocol client over websocket-client.
Usage as a library: from cdp import Page; p = Page.open(url); p.eval(js)"""
import json, sys, time, urllib.request, base64
import websocket

HOST = 'http://127.0.0.1:9333'

class Page:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, max_size=None, suppress_origin=True)
        self.ws.settimeout(600)
        self.n = 0
    @classmethod
    def open(cls, url, width=1920, height=1080, dsf=1.0):
        r = json.load(urllib.request.urlopen(urllib.request.Request(f'{HOST}/json/new?{url}', method='PUT')))
        p = cls(r['webSocketDebuggerUrl'])
        p.target_id = r['id']
        p.send('Page.enable'); p.send('Runtime.enable')
        p.send('Emulation.setDeviceMetricsOverride', width=width, height=height, deviceScaleFactor=dsf, mobile=False)
        p.send('Emulation.setFocusEmulationEnabled', enabled=True)
        return p
    @classmethod
    def attach(cls, target_id):
        for t in json.load(urllib.request.urlopen(f'{HOST}/json')):
            if t['id'] == target_id:
                p = cls(t['webSocketDebuggerUrl']); p.target_id = target_id
                p.send('Runtime.enable'); return p
        raise SystemExit('no target ' + target_id)
    def send(self, method, **params):
        self.n += 1
        mid = self.n
        self.ws.send(json.dumps({'id': mid, 'method': method, 'params': params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get('id') == mid:
                if 'error' in msg:
                    raise RuntimeError(f'{method}: {msg["error"]}')
                return msg.get('result', {})
    def eval(self, js, timeout=600):
        self.ws.settimeout(timeout)
        r = self.send('Runtime.evaluate', expression=js, awaitPromise=True, returnByValue=True, userGesture=True)
        if 'exceptionDetails' in r:
            ex = r['exceptionDetails']
            raise RuntimeError(ex.get('exception', {}).get('description') or ex.get('text'))
        return r.get('result', {}).get('value')
    def screenshot(self, path, fmt='png', quality=None):
        params = dict(format=fmt, captureBeyondViewport=False, fromSurface=True)
        if quality is not None: params['quality'] = quality
        r = self.send('Page.captureScreenshot', **params)
        with open(path, 'wb') as f: f.write(base64.b64decode(r['data']))
    def close(self):
        try: urllib.request.urlopen(f'{HOST}/json/close/{self.target_id}')
        except Exception: pass

if __name__ == '__main__':
    url, js = sys.argv[1], sys.argv[2]
    p = Page.open(url)
    time.sleep(float(sys.argv[3]) if len(sys.argv) > 3 else 3)
    print(json.dumps(p.eval(js), indent=1))
