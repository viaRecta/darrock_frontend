"""HTTP client used by the tracking frontend."""
from __future__ import annotations

import os

import requests


BACKEND_URL = os.environ.get('DARROCK_BACKEND_URL', 'http://127.0.0.1:6100')
TIMEOUT = 300


def get_json(path: str, params=None):
    response = requests.get(f'{BACKEND_URL}{path}', params=params, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()
