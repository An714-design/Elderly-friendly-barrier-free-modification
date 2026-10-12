import http.server
import socketserver
import threading

PORT = 8888

class MyHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map['.js'] = 'text/javascript'
    extensions_map['.mjs'] = 'text/javascript'
    extensions_map['.css'] = 'text/css'
    extensions_map['.html'] = 'text/html; charset=utf-8'

class ThreadedServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

with ThreadedServer(("", PORT), MyHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()