from __future__ import annotations

import json
import os

from flask import Flask, jsonify, redirect, render_template, request, session

from api_client import delete_json, get_json, get_with_status, patch_json, post_form, post_json
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
    return _fmt(value, '.2f')


@app.template_filter('f1')
def f1(value):
    return _fmt(value, '.1f')


@app.template_filter('f0')
def f0(value):
    if value is None:
        return '—'
    try:
        return format(int(float(value)), ',')
    except (ValueError, TypeError):
        return '—'


@app.template_filter('pct1')
def pct1(value):
    if value is None:
        return '—'
    try:
        return format(float(value) * 100, '.1f') + '%'
    except (ValueError, TypeError):
        return '—'


@app.template_filter('pct0')
def pct0(value):
    if value is None:
        return '—'
    try:
        return format(float(value) * 100, '.0f') + '%'
    except (ValueError, TypeError):
        return '—'


def _load_mock(filename: str) -> dict:
    path = os.path.join(MOCK_DIR, filename)
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    return {}


# Whether routes serve mock data (True) or call the real backend (False).
USE_MOCKDATA = False


@app.route('/')
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        req_data = request.get_json() or {}
        _, data = post_json('/auth/login', data=request.get_data())
        if data.get('success') and data.get('user'):
            session['user'] = data['user']
            session['password'] = req_data.get('password', '')
        status = 200 if data.get('success') else 401
        return jsonify(data), status
    if session.get('user'):
        return redirect('/research')
    return render_template('login.html')


@app.post('/logout')
def logout():
    session.clear()
    return jsonify({"success": True})


@app.route('/research', methods=['GET', 'POST'])
def research():
    if not USE_MOCKDATA and not session.get('user'):
        return redirect('/')
    if USE_MOCKDATA:
        data = _load_mock('dashboard_response.json')
    elif request.method == 'POST':
        _, data = post_form('/research/dashboard', data=request.form)
    else:
        data = get_json('/research/dashboard')
    if not data.get('user') and session.get('user'):
        data['user'] = session['user']
    return render_template('research.html', **data)


@app.route('/custom', methods=['GET', 'POST'])
def custom():
    """Custom portfolio backtest — user provides a fixed ticker list."""
    if not USE_MOCKDATA and not session.get('user'):
        return redirect('/')
    data = {}
    if request.method == 'POST':
        _, data = post_form('/research/custom-backtest', data=request.form)
        if not isinstance(data, dict):
            data = {}
    if not data.get('user') and session.get('user'):
        data['user'] = session['user']
    return render_template('custom.html', **data)


@app.route('/admin')
def admin():
    if USE_MOCKDATA:
        return 'Admin requires live backend', 503
    data = get_json('/admin/users')
    if not data.get('success'):
        return 'Admin access required', 403
    me = get_json('/auth/me')
    return render_template('admin.html', users=data['users'], user=me.get('user', {}))


@app.post('/admin/add_user')
def admin_add_user():
    _, data = post_json('/admin/users', data=request.get_data())
    return jsonify(data)


@app.post('/admin/reset_password/<int:user_id>')
def admin_reset_pw(user_id: int):
    _, data = post_json(f'/admin/users/{user_id}/password', data=request.get_data())
    return jsonify(data)


@app.post('/admin/delete_user/<int:user_id>')
def admin_delete(user_id: int):
    _, data = delete_json(f'/admin/users/{user_id}')
    return jsonify(data)


@app.route('/stock/<ticker>/<int:company_id>')
def stock(ticker: str, company_id: int):
    # ticker is decorative for the URL (human-readable); company_id drives the lookup.
    if USE_MOCKDATA:
        data = _load_mock(f'stock_response_{ticker}.json')
        if not data:
            data = _load_mock('stock_response_NVDA.json')
            data['ticker'] = ticker
            data['company_name'] = ticker
            data['company_id'] = company_id
    else:
        bq = request.args.get('buying_quarter', 'q4')
        if bq not in ('q1', 'q2', 'q3', 'q4'):
            bq = 'q4'
        data = get_json(f'/research/stock/{company_id}?buying_quarter={bq}')

    # If ?partial=1 → return just the fragment (for slide-over AJAX)
    if request.args.get('partial') == '1':
        return render_template('stock_partial.html', **data)
    return render_template('stock_page.html', **data)


@app.route('/p/<int:portfolio_id>')
def public(portfolio_id: int):
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
    return render_template('public.html', **data)


@app.post('/share_portfolio/<int:portfolio_id>')
def share_portfolio_route(portfolio_id: int):
    status_code, data = post_form(
        f'/research/portfolio/{portfolio_id}/share',
        data=request.get_data(),
    )
    return jsonify(data), status_code


# Portfolio CRUD proxies — backend API still lives under /api/v3/research/.
@app.get('/get_portfolio/<int:portfolio_id>')
def get_portfolio_route(portfolio_id: int):
    status_code, data = get_with_status(f'/api/v3/research/{portfolio_id}')
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


@app.post('/set_default_portfolio/<int:portfolio_id>')
def set_default_portfolio_route(portfolio_id: int):
    status_code, data = post_json(f'/api/v3/research/{portfolio_id}/default', data=b'')
    return jsonify(data), status_code


@app.post('/clear_default_portfolio')
def clear_default_portfolio_route():
    status_code, data = post_json('/api/v3/research/default/clear', data=b'')
    return jsonify(data), status_code


# ── Admin: tracked portfolios (CRUD page) ──────────────────────────────

@app.get('/admin/tracking')
def admin_tracking():
    if USE_MOCKDATA:
        return 'Admin requires live backend', 503
    if not session.get('user'):
        return redirect('/')
    data = get_json('/admin/tracking/portfolios')
    if not data.get('success'):
        return 'Admin access required', 403
    me = get_json('/auth/me')
    return render_template('admin_tracking.html',
                           portfolios=data.get('portfolios', []),
                           user=me.get('user', {}))


@app.post('/admin/tracking/resolve')
def admin_tracking_resolve():
    status_code, data = post_json('/admin/tracking/resolve-tickers',
                                  data=request.get_data())
    return jsonify(data), status_code


@app.post('/admin/tracking/create')
def admin_tracking_create():
    status_code, data = post_json('/admin/tracking/portfolios',
                                  data=request.get_data())
    return jsonify(data), status_code


@app.post('/admin/tracking/update/<int:portfolio_id>')
def admin_tracking_update(portfolio_id: int):
    status_code, data = patch_json(f'/admin/tracking/portfolios/{portfolio_id}',
                                   data=request.get_data())
    return jsonify(data), status_code


@app.post('/admin/tracking/delete/<int:portfolio_id>')
def admin_tracking_delete(portfolio_id: int):
    hard = request.args.get('hard', '0')
    status_code, data = delete_json(
        f'/admin/tracking/portfolios/{portfolio_id}?hard={hard}')
    return jsonify(data), status_code


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6200, debug=True)
