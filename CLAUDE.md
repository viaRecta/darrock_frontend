# Darrock Frontend

## Project Overview
Two Flask frontends for the Darrock stock research platform. Research module for filtering/backtesting/portfolio management. Tracking module for daily portfolio performance dashboards.

**A "year" is 4 quarters. The buying quarter is configurable (Q1-Q4), which shifts which financial data is used.**

## Architecture
- **Research** (port 6200): Flask + Jinja2 + vanilla JS — filtering, backtesting, portfolio CRUD, admin
- **Tracking** (port 6300): Flask + Chart.js — daily performance charts, 5-tab dashboard
- **Backend repo**: https://github.com/viaRecta/darrock_backend.git (Flask API, port 6100)

## Routing
- Research: `/v3/*` routes (current), other routes are legacy back-compat
- Backend API: `/api/v2/*`

## Environment Config (implemented 2026-04-15)
Each frontend has a `config.py` that controls backend connection:

| DARROCK_ENV | Backend URL | Auth |
|-------------|-------------|------|
| `development` (default) | proxy: `darrock-backend.viasyazilim.com` | Basic Auth (apiUser) |
| `production` (set in WSGI) | `127.0.0.1:6100` | None (localhost) |

- `config.py` in each frontend is the single source of truth
- `.env.example` documents all overridable env vars
- WSGI files set `DARROCK_ENV=production` for the server
- No extra dependencies needed (no python-dotenv)

## Key Files
| File | Purpose |
|------|---------|
| research/config.py | Research env config |
| tracking/config.py | Tracking env config |
| research/api_client.py | HTTP client to backend (uses config) |
| tracking/api_client.py | HTTP client to backend (uses config) |
| research/app.py | Research Flask routes |
| tracking/app.py | Tracking Flask routes |
| research/static/js/v3.js | Research UI interactivity |
| tracking/static/tracking.js | Chart.js dashboards |
| research/mock_data/ | Offline dev data for frontend devs |

## Deployment
- Server: Apache WSGI + Let's Encrypt on viasyazilim.com
- darrock-research.viasyazilim.com (research, auth required except /v3/p/* public share)
- darrock.viasyazilim.com (tracking, public)
- Backend proxy protected with htpasswd — one shared apiUser for all frontend devs

## Pending Work (as of 2026-04-15)
- Docker/py3.12 discussion still open (backend concern, but affects full stack)
- Previous sessions had more task ideas — ask Onur to recall them
