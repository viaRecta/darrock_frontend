from __future__ import annotations

import json
import os

from flask import Flask, jsonify, redirect, render_template, request, session

from api_client import delete_json, get_json, get_with_status, post_form, post_json
import config


app = Flask(__name__)
app.secret_key = config.SECRET_KEY

MOCK_DIR = os.path.join(os.path.dirname(__file__), 'mock_data')


# ── Jinja2 filters for safe formatting ──────────────────────────────────

def _fmt(value, spec):
    """Format a number safely — return '—' for None/NaN."""
    if value is None:
        return '—'
    try:
        return format(float(value), spec)
    except (ValueError, TypeError):
        return '—'


@app.template_filter('f2')
def f2(value):
    """Format as 2 decimal places, e.g. 192.53"""
    return _fmt(value, '.2f')


@app.template_filter('f1')
def f1(value):
    """Format as 1 decimal place, e.g. 14.8"""
    return _fmt(value, '.1f')


@app.template_filter('f0')
def f0(value):
    """Format as integer with commas, e.g. 385,706"""
    if value is None:
        return '—'
    try:
        return format(int(float(value)), ',')
    except (ValueError, TypeError):
        return '—'


@app.template_filter('pct1')
def pct1(value):
    """Format as percentage with 1 decimal, e.g. 14.8%. Assumes value is a ratio (0.148 → 14.8%)."""
    if value is None:
        return '—'
    try:
        return format(float(value) * 100, '.1f') + '%'
    except (ValueError, TypeError):
        return '—'


@app.template_filter('pct0')
def pct0(value):
    """Format as integer percentage. Assumes value is a ratio."""
    if value is None:
        return '—'
    try:
        return format(float(value) * 100, '.0f') + '%'
    except (ValueError, TypeError):
        return '—'


def _load_mock(filename: str) -> dict:
    """Load a JSON mock data file. Returns empty dict if missing."""
    path = os.path.join(MOCK_DIR, filename)
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    return {}


# Whether v2 routes serve mock data (True) or call the real backend (False).
# Flip to False once the backend is deployed with the new fields.
USE_MOCKDATA = False

@app.route('/v3/')
@app.route('/v3/login', methods=['GET', 'POST'])
def v3_login():
    if request.method == 'POST':
        # AJAX login — proxy to backend, store result in frontend session
        req_data = request.get_json() or {}
        _, data = post_json('/auth/login', data=request.get_data())
        if data.get('success') and data.get('user'):
            session['user'] = data['user']
            session['password'] = req_data.get('password', '')
        status = 200 if data.get('success') else 401
        return jsonify(data), status
    # Already logged in? Go to research
    if session.get('user'):
        return redirect('/v3/research')
    return render_template('v3/login.html')


@app.post('/v3/logout')
def v3_logout():
    session.clear()
    return jsonify({"success": True})


@app.route('/v3/research', methods=['GET', 'POST'])
def v3_research():
    if not USE_MOCKDATA and not session.get('user'):
        return redirect('/v3/')
    if USE_MOCKDATA:
        data = _load_mock('dashboard_response.json')
    elif request.method == 'POST':
        _, data = post_form('/research/dashboard', data=request.form)
    else:
        data = get_json('/research/dashboard')
    # Inject user from frontend session into template data
    if not data.get('user') and session.get('user'):
        data['user'] = session['user']
    return render_template('v3/research.html', **data)


def get_dashboard_payload():
    if request.args.get('mock') == '1':
        return _load_mock('dashboard_response.json'), 'Mock data'

    try:
        if request.method == 'POST':
            status_code, data = post_form('/api/research/dashboard', data=request.form)
            if status_code >= 400:
                raise RuntimeError(f'Dashboard POST failed with status {status_code}: {data}')
        else:
            data = get_json('/api/research/dashboard')
        return data, 'Live dashboard'
    except Exception as exc:
        app.logger.warning('Dashboard data fallback: %s', exc)
        return _load_mock('dashboard_response.json'), 'Mock fallback'


@app.route('/v3/admin')
def v3_admin():
    if USE_MOCKDATA:
        return 'Admin requires live backend', 503
    data = get_json('/admin/users')
    if not data.get('success'):
        return 'Admin access required', 403
    me = get_json('/auth/me')
    return render_template('v3/admin.html', users=data['users'], user=me.get('user', {}))


@app.post('/v3/admin/add_user')
def v3_admin_add_user():
    _, data = post_json('/admin/users', data=request.get_data())
    return jsonify(data)


@app.post('/v3/admin/reset_password/<int:user_id>')
def v3_admin_reset_pw(user_id: int):
    _, data = post_json(f'/admin/users/{user_id}/password', data=request.get_data())
    return jsonify(data)


@app.post('/v3/admin/delete_user/<int:user_id>')
def v3_admin_delete(user_id: int):
    _, data = delete_json(f'/admin/users/{user_id}')
    return jsonify(data)


@app.route('/v3/stock/<ticker>')
def v3_stock(ticker: str):
    if USE_MOCKDATA:
        data = _load_mock(f'stock_response_{ticker}.json')
        if not data:
            data = _load_mock('stock_response_NVDA.json')
            data['ticker'] = ticker
            data['company_name'] = ticker
    else:
        data = get_json(f'/research/stock/{ticker}')

    # If ?partial=1 → return just the fragment (for slide-over AJAX)
    if request.args.get('partial') == '1':
        return render_template('v3/stock_partial.html', **data)
    return render_template('v3/stock_page.html', **data)


@app.route('/v3/p/<int:portfolio_id>')
def v3_public(portfolio_id: int):
    if USE_MOCKDATA:
        mock = _load_mock('dashboard_response.json')
        portfolio = None
        for p in mock.get('saved_portfolios', []):
            if p['id'] == portfolio_id:
                portfolio = p
                break
        if not portfolio and mock.get('saved_portfolios'):
            portfolio = mock['saved_portfolios'][0]
        data = {
            'portfolio': portfolio or {'name': 'Unknown', 'year': 2026, 'tickers': [], 'buy_prices': {}},
            'company_details': mock.get('company_details', {}),
            'performance_metrics': mock.get('performance_metrics', {}),
            'results': mock.get('results', []),
        }
    else:
        _, portfolio_data = get_with_status(f'/research/portfolio/{portfolio_id}')
        dashboard_data = get_json('/research/dashboard')
        data = {
            'portfolio': portfolio_data.get('portfolio', {}),
            'company_details': dashboard_data.get('company_details', {}),
            'performance_metrics': dashboard_data.get('performance_metrics', {}),
            'results': dashboard_data.get('results', []),
        }
    return render_template('v3/public.html', **data)


# v3 portfolio share toggle (proxies to backend)
@app.post('/share_portfolio/<int:portfolio_id>')
def share_portfolio_route(portfolio_id: int):
    status_code, data = post_form(
        f'/research/portfolio/{portfolio_id}/share',
        data=request.get_data(),
    )
    return jsonify(data), status_code


##
## Legacy routes below - can be removed once v3 is fully live
##



@app.route('/', methods=['GET', 'POST'])
def investor_view():
    data = get_json('/api/research/investor')
    return render_template('investor4.html', **data)


@app.route('/dashboard', methods=['GET', 'POST'])
def dashboard_view():
    data, data_source = get_dashboard_payload()
    return render_template(
        'financial_dashboard_tailwind.html',
        dashboard_data=data,
        prototype_data_source=data_source,
    )


@app.route('/dashboard-legacy', methods=['GET', 'POST'])
def dashboard_legacy_view():
    if request.method == 'POST':
        status_code, data = post_form('/api/research/dashboard', data=request.form)
        if status_code >= 400:
            return jsonify(data), status_code
    else:
        data = get_json('/api/research/dashboard')
    return render_template('dashboard3.html', **data)


@app.route('/performance')
def performance_view():
    data = get_json('/api/research/performance')
    return render_template('performance.html', **data)


@app.route('/stock/<ticker>')
def stock_detail(ticker: str):
    data = get_json(f'/api/research/stock/{ticker}')
    return render_template('stock_detail.html', **data)


@app.get('/get_portfolio/<int:portfolio_id>')
def get_portfolio_route(portfolio_id: int):
    # No v3 equivalent yet — research configs are listed via dashboard payload
    status_code, data = get_with_status(f'/api/v2/research/portfolio/{portfolio_id}')
    return jsonify(data), status_code


@app.post('/save_portfolio')
def save_portfolio_route():
    payload = request.form.to_dict(flat=False)
    status_code, data = post_form('/api/v3/research/save', data=payload)
    return jsonify(data), status_code


@app.post('/delete_portfolio/<int:portfolio_id>')
def delete_portfolio_route(portfolio_id: int):
    status_code, data = delete_json(f'/api/v3/research/{portfolio_id}')
    return jsonify(data), status_code



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6200, debug=True)
