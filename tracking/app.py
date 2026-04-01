"""Tracking-only frontend for Darrock."""
from __future__ import annotations

from flask import Flask, render_template, request

from api_client import get_json


app = Flask(__name__)


@app.route('/track_portfolio', methods=['GET'])
def track_portfolio():
    params = {
        'portfolio_id': request.args.get('portfolio_id', 20, type=int),
        'year': request.args.get('year', type=int),
        'mode': request.args.get('mode', 'fixed_shares'),
        'initial_cash': request.args.get('initial_cash', 10000, type=float),
    }
    data = get_json('/api/tracking/portfolio', params=params)
    return render_template('tracking3.html', **data)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6300, debug=True)
