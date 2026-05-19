"""Tracking frontend (port 6300). Reads /api/tracking/* — company_id native,
scorecard layout with 5 lazy-loaded tabs. Honors per-portfolio start_date
and initial_cash.
"""
from __future__ import annotations

import json

from flask import Flask, jsonify, render_template, request

import config
from api_client import get_json


app = Flask(__name__)
app.secret_key = config.SECRET_KEY


@app.get('/')
def index():
    data = get_json('/api/tracking/portfolios')
    return render_template('list.html', portfolios=data.get('portfolios', []))


@app.get('/portfolio/<int:portfolio_id>')
def detail(portfolio_id: int):
    """Scorecard layout — base payload (summary cards + main chart + risk
    strip + Holdings) loads here. Other tabs fetch lazily from JS."""
    params = {}
    if request.args.get('initial_cash'):
        params['initial_cash'] = request.args.get('initial_cash', type=float)
    data = get_json(f'/api/tracking/portfolios/{portfolio_id}', params=params)
    if 'error' in data:
        return render_template('error.html', message=data['error']), 404
    return render_template(
        'detail.html',
        portfolio=data['portfolio'],
        holdings=data['holdings'],
        summary=data['summary'],
        risk_strip=data['risk_strip'],
        warnings=data.get('warnings', []),
        series_json=json.dumps(data['series']),
        portfolio_id=portfolio_id,
    )


# ── Tab proxies — frontend fetches these on tab click ──────────────────

@app.get('/portfolio/<int:portfolio_id>/<tab>')
def detail_tab(portfolio_id: int, tab: str):
    if tab not in ('contribution', 'sectors', 'risk', 'daily'):
        return jsonify({'error': 'unknown tab'}), 404
    params = {}
    if request.args.get('initial_cash'):
        params['initial_cash'] = request.args.get('initial_cash', type=float)
    if tab == 'daily':
        for k in ('offset', 'limit'):
            if request.args.get(k):
                params[k] = request.args.get(k, type=int)
    return jsonify(get_json(
        f'/api/tracking/portfolios/{portfolio_id}/{tab}', params=params))


@app.get('/api/portfolios')
def api_portfolios():
    return jsonify(get_json('/api/tracking/portfolios'))


@app.get('/api/portfolio/<int:portfolio_id>')
def api_portfolio(portfolio_id: int):
    params = {}
    if request.args.get('initial_cash'):
        params['initial_cash'] = request.args.get('initial_cash', type=float)
    return jsonify(get_json(f'/api/tracking/portfolios/{portfolio_id}',
                            params=params))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6300, debug=True)
