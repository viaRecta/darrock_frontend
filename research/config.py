"""
Research frontend configuration.

Defaults are dev-friendly (proxy URL + Basic Auth).
On the server, set DARROCK_ENV=production in the WSGI file.
"""
from __future__ import annotations

import os

ENV = os.environ.get("DARROCK_ENV", "development")

# ── Backend connection ────────────────────────────────────────────────
if ENV == "production":
    BACKEND_URL = "http://127.0.0.1:6100/api/v3"
    BACKEND_AUTH = None                       # localhost, no auth needed
else:
    BACKEND_URL = "https://darrock-backend.viasyazilim.com/api/v3"
    BACKEND_AUTH = ("apiUser", "viashipyard1907")

# Allow env-var override for custom setups
BACKEND_URL = os.environ.get("DARROCK_BACKEND_URL", BACKEND_URL)

# ── Flask ─────────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "darrock-research-frontend-dev-key")

# ── Timeout for backend requests (seconds) ────────────────────────────
TIMEOUT = int(os.environ.get("DARROCK_BACKEND_TIMEOUT", "300"))
