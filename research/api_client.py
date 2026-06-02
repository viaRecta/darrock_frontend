from __future__ import annotations

import base64
import requests
from flask import session

import config


def build_url(path: str) -> str:
    safe_path = path if path.startswith('/') else f'/{path}'
    return f'{config.BACKEND_URL.rstrip("/")}{safe_path}'


def _auth_headers():
    """Build auth headers from the current user's session credentials.
    Falls back to proxy Basic Auth in dev, or no auth in production."""
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
    response = requests.get(build_url(path), headers=_auth_headers(), timeout=config.TIMEOUT, **kwargs)
    response.raise_for_status()
    return response.json()


def post_form(path: str, data=None):
    response = requests.post(build_url(path), headers=_auth_headers(), data=data, timeout=config.TIMEOUT)
    return response.status_code, response.json()


def post_json(path: str, data=None):
    h = {**_auth_headers(), 'Content-Type': 'application/json'}
    response = requests.post(build_url(path), headers=h, data=data, timeout=config.TIMEOUT)
    return response.status_code, response.json()


def patch_json(path: str, data=None):
    h = {**_auth_headers(), 'Content-Type': 'application/json'}
    response = requests.patch(build_url(path), headers=h, data=data, timeout=config.TIMEOUT)
    return response.status_code, response.json()


def delete_json(path: str):
    response = requests.delete(build_url(path), headers=_auth_headers(), timeout=config.TIMEOUT)
    return response.status_code, response.json()


def get_with_status(path: str):
    response = requests.get(build_url(path), headers=_auth_headers(), timeout=config.TIMEOUT)
    return response.status_code, response.json()
