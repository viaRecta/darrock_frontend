from __future__ import annotations

import base64
import requests
from flask import session

import config


def _backend_root() -> str:
    url = config.BACKEND_URL.rstrip('/')
    for suffix in ('/api/v3', '/api/v2', '/api/v1'):
        if url.endswith(suffix):
            return url[:-len(suffix)]
    return url


def build_url(path: str) -> str:
    safe = path if path.startswith('/') else f'/{path}'
    if safe.startswith('/api/'):
        return f'{_backend_root()}{safe}'
    return f'{config.BACKEND_URL.rstrip("/")}{safe}'


def _auth_headers():
    user = session.get('user')
    password = session.get('password')
    if user and password:
        creds = base64.b64encode(f"{user['username']}:{password}".encode()).decode()
        return {"Authorization": f"Basic {creds}"}
    if config.BACKEND_AUTH:
        creds = base64.b64encode(
            f"{config.BACKEND_AUTH[0]}:{config.BACKEND_AUTH[1]}".encode()
        ).decode()
        return {"Authorization": f"Basic {creds}"}
    return {}


def get_json(path: str, **kwargs):
    r = requests.get(build_url(path), headers=_auth_headers(),
                     timeout=config.TIMEOUT, **kwargs)
    r.raise_for_status()
    return r.json()


def post_json(path: str, data=None):
    h = {**_auth_headers(), 'Content-Type': 'application/json'}
    r = requests.post(build_url(path), headers=h, data=data, timeout=config.TIMEOUT)
    return r.status_code, r.json()
