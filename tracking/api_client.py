from __future__ import annotations

import os
import requests
import base64

credentials = base64.b64encode(b"apiUser:viashipyard1907").decode("utf-8")

headers = {
    "Authorization": f"Basic {credentials}"
}

# BACKEND_URL = os.environ.get('DARROCK_BACKEND_URL', 'http://127.0.0.1:6100')
BACKEND_URL = os.environ.get('DARROCK_BACKEND_URL', 'https://darrock-backend.viasyazilim.com')
TIMEOUT = 300


def get_json(path: str, params=None):
    response = requests.get(f'{BACKEND_URL}{path}', headers=headers, params=params, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()
