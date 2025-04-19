#!/usr/bin/env python3
"""
FlashGyaan Development Server

A simple HTTP server for serving the FlashGyaan application during development.
Features:
- CORS support for local development
- Proper MIME type handling for JavaScript files
- Automatic port cleanup
- Cache control headers

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

# Configure logging with timestamp, log level, and message format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CORSRequestHandler(SimpleHTTPRequestHandler):
    """
    Custom request handler with CORS support and proper MIME type handling.
    
    This handler allows cross-origin requests and ensures JavaScript files
    are served with the correct content type.
    """
    
    def end_headers(self):
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

    def do_GET(self):
        """
        Handle GET requests.
        
        Specifically handles JavaScript files to ensure they're served
        with the correct MIME type. For files in the /src/ directory,
        looks for them relative to the project root.
        
        The method:
        1. Checks if the request is for a JavaScript file
        2. Sets appropriate headers
        3. Determines the correct file path based on the request
        4. Serves the file content
        """
        try:
            # Check if the request is for a JavaScript file
            if self.path.endswith('.js'):
                # Set response headers for JavaScript files
                self.send_response(200)
                self.send_header('Content-type', 'application/javascript')
                self.end_headers()
                
                # Determine the correct file path
                if self.path.startswith('/src/'):
                    # For /src/ paths, look in the project root
                    file_path = os.path.join(
                        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                        self.path[1:]
                    )
                else:
                    # For other paths, look in the current working directory
                    file_path = os.path.join(os.getcwd(), self.path[1:])
                
                # Read and serve the file content
                with open(file_path, 'rb') as file:
                    self.wfile.write(file.read())
                return
            # For non-JavaScript files, use the default handler
            return super().do_GET()
        except Exception as e:
            # Log any errors that occur while serving files
            logger.error(f"Error serving {self.path}: {str(e)}")
            self.send_error(500, f"Internal server error: {str(e)}")

def cleanup_port(port):
    """
    Attempt to clean up any process using the specified port.
    
    This function tries to kill any existing process that might be
    using the specified port to prevent "Address already in use" errors.
    
    Args:
        port (int): The port number to clean up
        
    The function handles both Windows and Unix-like systems differently:
    - Windows: Uses taskkill to terminate the process
    - Unix: Uses pkill to terminate Python server processes
    """
    try:
        if sys.platform == 'win32':
            # Windows-specific cleanup using taskkill
            subprocess.run(['taskkill', '/F', '/PID', f'$(netstat -ano | findstr :{port})'], check=False)
        else:
            # Unix-like systems cleanup using pkill
            subprocess.run(['pkill', '-f', f'python.*server.py'], check=False)
    except Exception as e:
        # Log any errors during cleanup but continue execution
        logger.warning(f"Failed to clean up port {port}: {str(e)}")

def run_server(port=8000):
    """
    Start the development server.
    
    This function:
    1. Cleans up any existing process on the port
    2. Changes to the project root directory
    3. Creates and starts the HTTP server
    4. Handles server shutdown on keyboard interrupt
    
    Args:
        port (int): The port to run the server on (default: 8000)
    """
    try:
        # Clean up any existing process on the port
        cleanup_port(port)
        
        # Change to the project root directory for serving files
        os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        # Create and start the server
        server_address = ('', port)
        httpd = HTTPServer(server_address, CORSRequestHandler)
        logger.info(f'Server running on port {port}...')
        logger.info('Press Ctrl+C to stop the server')
        httpd.serve_forever()
    except KeyboardInterrupt:
        # Handle graceful shutdown on Ctrl+C
        logger.info('\nShutting down server...')
        httpd.server_close()
    except Exception as e:
        # Log any other errors and exit
        logger.error(f"Failed to start server: {str(e)}")
        sys.exit(1)

# Entry point for the script
if __name__ == '__main__':
    run_server() 