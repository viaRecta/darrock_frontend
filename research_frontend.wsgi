import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend_research')
sys.path.insert(0, FRONTEND_DIR)

from app import app as application
