"""Serveur local pour le developpement : sert le site sans cache navigateur.

    python tools/serve.py          (port 5580 par defaut)
    python tools/serve.py 8000
"""
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCache(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


http.server.SimpleHTTPRequestHandler.extensions_map['.js'] = 'text/javascript'
port = int(sys.argv[1]) if len(sys.argv) > 1 else 5580
print(f'Piano Learn : http://localhost:{port}')
http.server.ThreadingHTTPServer(('', port), NoCache).serve_forever()
