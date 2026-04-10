from __future__ import annotations

import json
import os

from flask import Flask, jsonify, render_template, request

from api_client import delete_json, get_json, get_with_status, post_form


app = Flask(__name__)

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
@app.route('/v3/login')
def v3_login():
    return render_template('v3/login.html')


@app.route('/v3/research', methods=['GET', 'POST'])
def v3_research():
    if USE_MOCKDATA:
        data = _load_mock('dashboard_response.json')
    elif request.method == 'POST':
        _, data = post_form('/api/v2/research/dashboard', data=request.form)
    else:
        data = get_json('/api/v2/research/dashboard')
    return render_template('v3/research.html', **data)


@app.route('/v3/stock/<ticker>')
def v3_stock(ticker: str):
    if USE_MOCKDATA:
        data = _load_mock(f'stock_response_{ticker}.json')
        if not data:
            data = _load_mock('stock_response_NVDA.json')
            data['ticker'] = ticker
            data['company_name'] = ticker
    else:
        data = get_json(f'/api/v2/research/stock/{ticker}')

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
        _, portfolio_data = get_with_status(f'/api/v2/research/portfolio/{portfolio_id}')
        dashboard_data = get_json('/api/v2/research/dashboard')
        data = {
            'portfolio': portfolio_data.get('portfolio', {}),
            'company_details': dashboard_data.get('company_details', {}),
            'performance_metrics': dashboard_data.get('performance_metrics', {}),
            'results': dashboard_data.get('results', []),
        }
    return render_template('v3/public.html', **data)


##
## Legacy routes below - can be removed once v3 is fully live
##



@app.route('/', methods=['GET', 'POST'])
def investor_view():
    data = get_json('/api/research/investor')
    return render_template('investor4.html', **data)


@app.route('/dashboard', methods=['GET', 'POST'])
def dashboard_view():
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
    status_code, data = get_with_status(f'/api/research/portfolio/{portfolio_id}')
    return jsonify(data), status_code


@app.post('/save_portfolio')
def save_portfolio_route():
    payload = request.form.to_dict(flat=False)
    status_code, data = post_form('/api/research/portfolio', data=payload)
    return jsonify(data), status_code


@app.post('/delete_portfolio/<int:portfolio_id>')
def delete_portfolio_route(portfolio_id: int):
    status_code, data = delete_json(f'/api/research/portfolio/{portfolio_id}')
    return jsonify(data), status_code



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6200, debug=True)
