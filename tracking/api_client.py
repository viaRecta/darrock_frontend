from __future__ import annotations

import base64
import requests

import config


def _auth_headers():
    """Build Basic Auth headers for dev proxy. Returns empty dict in production."""
    if config.BACKEND_AUTH:
        creds = base64.b64encode(
            f"{config.BACKEND_AUTH[0]}:{config.BACKEND_AUTH[1]}".encode()
        ).decode()
        return {"Authorization": f"Basic {creds}"}
    return {}


def get_json(path: str, params=None):
    response = requests.get(
        f'{config.BACKEND_URL}{path}',
        headers=_auth_headers(),
        params=params,
        timeout=config.TIMEOUT,
    )
    response.raise_for_status()
    return response.json()
