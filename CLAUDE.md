# Darrock Frontend

## Project Overview
Two Flask frontends for the Darrock stock research platform. Research module for filtering/backtesting/portfolio management. Tracking module for daily portfolio performance dashboards.

**A "year" is 4 quarters. The buying quarter is configurable (Q1-Q4), which shifts which financial data is used.**

## Architecture
- **Research** (port 6200): Flask + Jinja2 + vanilla JS — filtering, backtesting, portfolio CRUD, admin
- **Tracking** (port 6300): Flask + Chart.js — daily performance charts, 5-tab dashboard
- **Backend repo**: https://github.com/viaRecta/darrock_backend.git (Flask API, port 6100)

## Research Frontend Structure

### Page Versions
- **v1/Legacy** (`templates/*.html`): Bootstrap-based, purple gradients. Still works at `/`, `/dashboard`, etc.
- **v2** (`templates/v2/*.html`): darrock.com design, separate pages. Superseded by v3.
- **v3** (`templates/v3/*.html`): **Current**. Split-pane workspace, darrock.com design language.

### v3 Design System
- **CSS**: `static/css/v3.css` — custom, no frameworks. darrock.com aesthetic (#ebebeb bg, #404040 text, Castellar/Newsreader/Jost fonts)
- **JS**: `static/js/v3.js` — vanilla JS (split-pane, accordions, slide-over stock detail, metric row toggles, share/delete, logout)
- **Fluid typography**: `clamp()` based — scales from 14px (phone) to 16.5px (2K desktop)
- **Desktop**: split-pane (left: filters, right: results)
- **Mobile**: bottom sheet for filters (FAB button to open, swipe-down to close)

### v3 Pages
| Route | Template | Auth | Purpose |
|-------|----------|------|---------|
| `/v3/` `/v3/login` | `login.html` | No | Login page (AJAX POST to backend) |
| `/v3/research` | `research.html` | Yes | Main workspace — filters + results |
| `/v3/stock/<ticker>` | `stock_page.html` / `stock_partial.html` | Yes | Stock detail (standalone or slide-over via AJAX ?partial=1) |
| `/v3/p/<id>` | `public.html` | No | Public shared portfolio performance |
| `/v3/admin` | `admin.html` | Admin | User management |

### Auth Flow
1. User enters credentials on `/v3/login`
2. Frontend AJAX POSTs to `/v3/login` → proxied to backend `/api/v2/auth/login`
3. Backend validates with bcrypt, returns user JSON
4. Frontend stores `session['user']` + `session['password']` (Flask session cookie)
5. All subsequent backend calls: `api_client.py` reads session, sends Basic Auth headers
6. Protected pages check `session.get('user')`, redirect to login if missing
7. Logout clears frontend session

### Filter Panel (research.html left panel)
The 5-year rule tab uses per-metric rows. Each row has:
- Metric label | Method dropdown (CAGR/Slope/Consistency) | Threshold input | Pos% input (consistency only) | Omit checkbox

Accordions:
1. **Screening Rules** — subtabs for 5-Year (Rule 1) and 2-Year (Rule 2)
2. **Ranking & Scoring** — method select + per-metric score weights
3. **Portfolio Settings** — start/end year, buying quarter, max size, retention, price filter
4. **Saved Portfolios** — list with load/share/delete + save form

### Jinja2 Safe Filters (registered in app.py)
All formatting uses null-safe custom filters:
- `|f2` — 2 decimal places, None→"—"
- `|f1` — 1 decimal place
- `|f0` — integer with commas
- `|pct1` — ratio×100 with 1 decimal + %
- `|pct0` — ratio×100 integer + %

### API Client (api_client.py)
- Reads credentials from Flask session (logged-in user's username + password)
- Sends Basic Auth to backend on every request
- Falls back to `config.BACKEND_AUTH` for dev proxy (frontend devs without login)
- All functions: `get_json()`, `post_form()`, `post_json()`, `delete_json()`, `get_with_status()`

## Environment Config
Each frontend has `config.py`:
| DARROCK_ENV | Backend URL | Auth |
|-------------|-------------|------|
| `development` (default) | proxy via viasyazilim.com | Basic Auth fallback |
| `production` (WSGI) | `127.0.0.1:6100` | User session credentials |

## Deployment
- Apache WSGI + Let's Encrypt on viasyazilim.com
- darrock-research.viasyazilim.com (research)
- darrock.viasyazilim.com (tracking, public)
- Apache auth to be removed when Flask auth goes fully live
- `/v3/p/*` path excluded from Apache auth (public share pages)

## Key Files
| File | Purpose |
|------|---------|
| research/config.py | Environment config |
| research/api_client.py | HTTP client to backend with session auth |
| research/app.py | Flask routes + Jinja2 filters |
| research/static/css/v3.css | v3 design system CSS |
| research/static/js/v3.js | v3 interactivity |
| research/templates/v3/ | All v3 HTML templates |
| research/mock_data/ | Offline dev data (USE_MOCKDATA flag in app.py) |

## ACTIVE WORK IN PROGRESS (as of 2026-04-12)

### Backend data pipeline task is in progress (see backend CLAUDE.md)
Frontend impact: when Step 2 (monthly membership) completes, results may change slightly.

### Pending frontend items
- FCF CAGR display in returns table (user requested, not yet added)
- When buying quarter changes, the returns table should show correct buy/sell months — backend now sends correct prices, frontend just displays them
