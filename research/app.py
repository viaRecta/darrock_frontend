from __future__ import annotations

from flask import Flask, jsonify, render_template, request

from api_client import delete_json, get_json, get_with_status, post_form


app = Flask(__name__)


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
