#!/usr/bin/env python3
import argparse
import http.server
import os
import socket
import socketserver
import sys
import threading
import webbrowser


def _find_open_port(start_port):
    port = start_port
    while port < start_port + 20:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            if sock.connect_ex(("127.0.0.1", port)) != 0:
                return port
        port += 1
    return None


def _open_browser(url):
    try:
        webbrowser.open(url, new=2)
    except Exception:
        print("Could not open the browser automatically.")


def main():
    parser = argparse.ArgumentParser(description="Run Park Pals local web server.")
    parser.add_argument("--port", type=int, default=8000, help="Port to serve on")
    parser.add_argument("--no-browser", action="store_true", help="Do not open a browser tab")
    args = parser.parse_args()

    web_root = os.path.join(os.path.dirname(__file__), "web", "public")
    if not os.path.isdir(web_root):
        print(f"Web root not found: {web_root}")
        sys.exit(1)

    os.chdir(web_root)

    port = _find_open_port(args.port)
    if port is None:
        print("No free ports found. Try a different --port value.")
        sys.exit(1)

    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        url = f"http://localhost:{port}"
        print("Park Pals server is running.")
        print(f"Open this in your browser: {url}")
        print("Press Ctrl+C to stop the server.")
        if not args.no_browser:
            threading.Timer(0.6, _open_browser, args=[url]).start()
        httpd.serve_forever()


if __name__ == "__main__":
    main()
