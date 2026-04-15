import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DARROCK_ENV', 'production')
from app import app as application
