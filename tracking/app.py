"""Tracking-only frontend for Darrock."""
from __future__ import annotations

from flask import Flask, render_template, request

from api_client import get_json


app = Flask(__name__)


def build_tracking_params():
    params = {
        'portfolio_id': request.args.get('portfolio_id', 20, type=int),
        'year': request.args.get('year', type=int),
        'mode': request.args.get('mode', 'fixed_shares'),
        'initial_cash': request.args.get('initial_cash', 10000, type=float),
    }
    store_portfolio = request.args.get('store_portfolio')
    if store_portfolio is not None:
        params['store_portfolio'] = store_portfolio
    return params


def render_tracking_template(template_name: str):
    params = build_tracking_params()
    data = get_json('/api/tracking/portfolio', params=params)
    return render_template(template_name, **data)


@app.route('/', methods=['GET'])
@app.route('/track_portfolio', methods=['GET'])
def track_portfolio():
    return render_tracking_template('tracking3.html')


@app.route('/legacy', methods=['GET'])
def track_portfolio_legacy():
    return render_tracking_template('tracking3eski.html')


@app.route('/tracking3eski.html', methods=['GET'])
def track_portfolio_legacy_file():
    return render_tracking_template('tracking3eski.html')


@app.route('/tracking3.html', methods=['GET'])
def track_portfolio_current_file():
    return render_tracking_template('tracking3.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6300, debug=True)
