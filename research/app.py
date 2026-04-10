from __future__ import annotations

import json
import os

from flask import Flask, jsonify, render_template, request

from api_client import delete_json, get_json, get_with_status, post_form


app = Flask(__name__)

MOCK_DIR = os.path.join(os.path.dirname(__file__), 'mock_data')


def _load_mock(filename: str) -> dict:
    """Load a JSON mock data file. Returns empty dict if missing."""
    path = os.path.join(MOCK_DIR, filename)
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    return {}


# Whether v2 routes serve mock data (True) or call the real backend (False).
# Flip to False once the backend is deployed with the new fields.
V2_USE_MOCK = True


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


# ==============================================================
# v2 routes — new design, mock-data driven until backend deploys
# ==============================================================

@app.route('/v2/')
@app.route('/v2/login')
def v2_login():
    return render_template('v2/login.html')


@app.route('/v2/dashboard', methods=['GET', 'POST'])
def v2_dashboard():
    if V2_USE_MOCK:
        data = _load_mock('dashboard_response.json')
    elif request.method == 'POST':
        _, data = post_form('/api/research/dashboard', data=request.form)
    else:
        data = get_json('/api/research/dashboard')
    return render_template('v2/dashboard.html', **data)


@app.route('/v2/stock/<ticker>')
def v2_stock_detail(ticker: str):
    if V2_USE_MOCK:
        data = _load_mock(f'stock_response_{ticker}.json')
        if not data:
            data = _load_mock('stock_response_NVDA.json')
            data['ticker'] = ticker
            data['company_name'] = ticker
    else:
        data = get_json(f'/api/research/stock/{ticker}')
    return render_template('v2/stock_detail.html', **data)


@app.route('/v2/performance')
def v2_performance():
    if V2_USE_MOCK:
        data = _load_mock('dashboard_response.json')
    else:
        data = get_json('/api/research/dashboard')
    return render_template('v2/performance.html', **data)


@app.route('/v2/shared/<int:portfolio_id>')
def v2_shared(portfolio_id: int):
    if V2_USE_MOCK:
        mock = _load_mock('dashboard_response.json')
        # Simulate picking a specific portfolio
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
        _, portfolio_data = get_with_status(f'/api/research/portfolio/{portfolio_id}')
        dashboard_data = get_json('/api/research/dashboard')
        data = {
            'portfolio': portfolio_data.get('portfolio', {}),
            'company_details': dashboard_data.get('company_details', {}),
            'performance_metrics': dashboard_data.get('performance_metrics', {}),
            'results': dashboard_data.get('results', []),
        }
    return render_template('v2/shared.html', **data)


# ==============================================================
# v3 routes — split-pane workspace design
# ==============================================================

@app.route('/v3/')
@app.route('/v3/login')
def v3_login():
    return render_template('v3/login.html')


@app.route('/v3/research', methods=['GET', 'POST'])
def v3_research():
    if V2_USE_MOCK:
        data = _load_mock('dashboard_response.json')
    elif request.method == 'POST':
        _, data = post_form('/api/research/dashboard', data=request.form)
    else:
        data = get_json('/api/research/dashboard')
    return render_template('v3/research.html', **data)


@app.route('/v3/stock/<ticker>')
def v3_stock(ticker: str):
    if V2_USE_MOCK:
        data = _load_mock(f'stock_response_{ticker}.json')
        if not data:
            data = _load_mock('stock_response_NVDA.json')
            data['ticker'] = ticker
            data['company_name'] = ticker
    else:
        data = get_json(f'/api/research/stock/{ticker}')

    # If ?partial=1 → return just the fragment (for slide-over AJAX)
    if request.args.get('partial') == '1':
        return render_template('v3/stock_partial.html', **data)
    return render_template('v3/stock_page.html', **data)


@app.route('/v3/p/<int:portfolio_id>')
def v3_public(portfolio_id: int):
    if V2_USE_MOCK:
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
        _, portfolio_data = get_with_status(f'/api/research/portfolio/{portfolio_id}')
        dashboard_data = get_json('/api/research/dashboard')
        data = {
            'portfolio': portfolio_data.get('portfolio', {}),
            'company_details': dashboard_data.get('company_details', {}),
            'performance_metrics': dashboard_data.get('performance_metrics', {}),
            'results': dashboard_data.get('results', []),
        }
    return render_template('v3/public.html', **data)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6200, debug=True)
