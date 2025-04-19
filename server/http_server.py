#!/usr/bin/env python3
"""
FlashGyaan Development Server

A simple HTTP server for serving the FlashGyaan application during development.
Features:
- CORS support for local development
- Proper MIME type handling for JavaScript files
- Automatic port cleanup
- Cache control headers
- File caching for better performance
- Improved error handling

Usage:
    python3 server.py

The server will start on port 8000 by default.
"""

# Import required modules
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import subprocess
import sys
import logging
from functools import lru_cache
from typing import Optional, Dict, Any

# Configure logging with timestamp, log level, and message format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MIME type mapping for common file extensions
MIME_TYPES = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
}

class CORSRequestHandler(SimpleHTTPRequestHandler):
    """
    Custom request handler with CORS support and proper MIME type handling.
    
    This handler allows cross-origin requests and ensures files
    are served with the correct content type and caching headers.
    """
    
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize the handler with a file cache."""
        self.file_cache: Dict[str, tuple[bytes, str]] = {}
        super().__init__(*args, **kwargs)
    
    def end_headers(self) -> None:
        """
        Add CORS and cache control headers to the response.
        
        Headers added:
        - Access-Control-Allow-Origin: * (allows requests from any origin)
        - Access-Control-Allow-Methods: GET (allows GET requests)
        - Cache-Control: no-store, no-cache, must-revalidate (prevents caching)
        """
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

    @lru_cache(maxsize=100)
    def get_file_path(self, path: str) -> str:
        """
        Get the absolute file path for a given request path.
        
        Args:
            path: The request path
            
        Returns:
            str: The absolute file path
        """
        # Handle root path
        if path == '/':
            path = '/index.html'
            
        if path.startswith('/src/'):
            return os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                path[1:]
            )
        return os.path.join(os.getcwd(), path[1:])

    def get_mime_type(self, path: str) -> str:
        """
        Get the MIME type for a file based on its extension.
        
        Args:
            path: The file path
            
        Returns:
            str: The MIME type
        """
        ext = os.path.splitext(path)[1].lower()
        return MIME_TYPES.get(ext, 'application/octet-stream')

    def do_GET(self) -> None:
        """
        Handle GET requests with improved file serving and caching.
        
        The method:
        1. Determines the correct file path
        2. Sets appropriate headers based on file type
        3. Serves the file content from cache if available
        4. Falls back to default handler for non-file requests
        """
        try:
            # Skip favicon.ico requests
            if self.path == '/favicon.ico':
                self.send_error(404)
                return

            # Get the file path
            file_path = self.get_file_path(self.path)
            
            # Check if file exists
            if not os.path.isfile(file_path):
                self.send_error(404)
                return

            # Get file content from cache or read from disk
            if file_path in self.file_cache:
                content, mime_type = self.file_cache[file_path]
            else:
                with open(file_path, 'rb') as file:
                    content = file.read()
                mime_type = self.get_mime_type(file_path)
                self.file_cache[file_path] = (content, mime_type)

            # Send response
            self.send_response(200)
            self.send_header('Content-type', mime_type)
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)

        except Exception as e:
            logger.error(f"Error serving {self.path}: {str(e)}")
            self.send_error(500, f"Internal server error: {str(e)}")

def cleanup_port(port: int) -> None:
    """
    Attempt to clean up any process using the specified port.
    
    Args:
        port: The port number to clean up
    """
    try:
        if sys.platform == 'win32':
            subprocess.run(['taskkill', '/F', '/PID', f'$(netstat -ano | findstr :{port})'], check=False)
        else:
            subprocess.run(['pkill', '-f', f'python.*server.py'], check=False)
    except Exception as e:
        logger.warning(f"Failed to clean up port {port}: {str(e)}")

def run_server(port: int = 8000) -> None:
    """
    Start the development server with improved error handling.
    
    Args:
        port: The port to run the server on (default: 8000)
    """
    try:
        # Clean up any existing process on the port
        cleanup_port(port)
        
        # Change to the project root directory
        os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        # Create and start the server
        server_address = ('', port)
        httpd = HTTPServer(server_address, CORSRequestHandler)
        logger.info(f'Server running on port {port}...')
        logger.info('Press Ctrl+C to stop the server')
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info('\nShutting down server...')
        httpd.server_close()
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        sys.exit(1)

# Entry point for the script
if __name__ == '__main__':
    run_server() 