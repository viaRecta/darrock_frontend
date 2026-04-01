from __future__ import annotations

import os

import requests


BACKEND_URL = os.environ.get('DARROCK_BACKEND_URL', 'http://127.0.0.1:6100')
TIMEOUT = 300


def get_json(path: str, **kwargs):
    response = requests.get(f'{BACKEND_URL}{path}', timeout=TIMEOUT, **kwargs)
    response.raise_for_status()
    return response.json()


def post_form(path: str, data=None):
    response = requests.post(f'{BACKEND_URL}{path}', data=data, timeout=TIMEOUT)
    return response.status_code, response.json()


def delete_json(path: str):
    response = requests.delete(f'{BACKEND_URL}{path}', timeout=TIMEOUT)
    return response.status_code, response.json()


def get_with_status(path: str):
    response = requests.get(f'{BACKEND_URL}{path}', timeout=TIMEOUT)
    return response.status_code, response.json()
