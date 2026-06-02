"""tracking_v3 frontend configuration. Mirrors research/ pattern."""
from __future__ import annotations

import os

ENV = os.environ.get("DARROCK_ENV", "development")

if ENV == "production":
    BACKEND_URL = "http://127.0.0.1:6100"
    BACKEND_AUTH = None
else:
    BACKEND_URL = "https://darrock-backend.viasyazilim.com"
    BACKEND_AUTH = ("apiUser", "viashipyard1907")

BACKEND_URL = os.environ.get("DARROCK_BACKEND_URL", BACKEND_URL)
SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "darrock-tracking-v3-dev-key")
TIMEOUT = int(os.environ.get("DARROCK_BACKEND_TIMEOUT", "300"))
