import sys
import os

# Add the parent directory to the path so we can import backend_api
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend_api import app

# This is the main entry point for Vercel
# Vercel will automatically handle the Flask app routing