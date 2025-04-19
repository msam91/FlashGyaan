#!/usr/bin/env python3
"""
FlashGyaan Development Server Launcher

This script launches the FlashGyaan development server.
It simply imports and runs the server from the server directory.
"""

import os
import sys

# Add the server directory to the path
server_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'server')
sys.path.append(server_dir)

# Import and run the server
from http_server import run_server

if __name__ == '__main__':
    run_server() 