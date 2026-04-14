from __future__ import annotations

import os
import base64
import requests
from flask import session

BACKEND_URL = os.environ.get('DARROCK_BACKEND_URL', 'http://127.0.0.1:6100/api/v2')
TIMEOUT = 300


def _auth_headers():
    """Build auth headers from the current user's session credentials.
    Falls back to no auth for public/login endpoints."""
    user = session.get('user')
    password = session.get('password')
    if user and password:
        creds = base64.b64encode(f"{user['username']}:{password}".encode()).decode()
        return {"Authorization": f"Basic {creds}"}
    return {}


def get_json(path: str, **kwargs):
    response = requests.get(f'{BACKEND_URL}{path}', headers=_auth_headers(), timeout=TIMEOUT, **kwargs)
    response.raise_for_status()
    return response.json()


def post_form(path: str, data=None):
    response = requests.post(f'{BACKEND_URL}{path}', headers=_auth_headers(), data=data, timeout=TIMEOUT)
    return response.status_code, response.json()


def post_json(path: str, data=None):
    h = {**_auth_headers(), 'Content-Type': 'application/json'}
    response = requests.post(f'{BACKEND_URL}{path}', headers=h, data=data, timeout=TIMEOUT)
    return response.status_code, response.json()


def delete_json(path: str):
    response = requests.delete(f'{BACKEND_URL}{path}', headers=_auth_headers(), timeout=TIMEOUT)
    return response.status_code, response.json()


def get_with_status(path: str):
    response = requests.get(f'{BACKEND_URL}{path}', headers=_auth_headers(), timeout=TIMEOUT)
    return response.status_code, response.json()
