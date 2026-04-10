from __future__ import annotations

import os
import requests
import base64

credentials = base64.b64encode(b"apiUser:viashipyard1907").decode("utf-8")

headers = {
    "Authorization": f"Basic {credentials}"
}

BACKEND_URL = os.environ.get('DARROCK_BACKEND_URL', 'http://127.0.0.1:6100')
# BACKEND_URL = os.environ.get('DARROCK_BACKEND_URL', 'https://darrock-backend.viasyazilim.com')
TIMEOUT = 300



def get_json(path: str, **kwargs):
    response = requests.get(f'{BACKEND_URL}{path}', headers=headers, timeout=TIMEOUT, **kwargs)
    response.raise_for_status()
    return response.json()


def post_form(path: str, data=None):
    response = requests.post(f'{BACKEND_URL}{path}', headers=headers, data=data, timeout=TIMEOUT)
    return response.status_code, response.json()


def delete_json(path: str):
    response = requests.delete(f'{BACKEND_URL}{path}', headers=headers, timeout=TIMEOUT)
    return response.status_code, response.json()


def get_with_status(path: str):
    response = requests.get(f'{BACKEND_URL}{path}', headers=headers, timeout=TIMEOUT)
    return response.status_code, response.json()
