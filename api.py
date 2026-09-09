"""HTTP adapter for the shared Excel parser and the static frontend."""
import json
import os
from pathlib import Path

import pandas as pd
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException

from parser import normalize_additional_payables

FRONTEND = Path(__file__).resolve().parent.parent / 'frontEND'
app = Flask(__name__, static_folder=None)
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_UPLOAD_MB', '20')) * 1024 * 1024
ALLOWED_ORIGINS = {v.strip() for v in os.getenv('CORS_ORIGINS', '').split(',') if v.strip()}


@app.after_request
def cors(response):
    origin = request.headers.get('Origin')
    if origin and origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.vary.add('Origin')
    return response


@app.errorhandler(HTTPException)
def http_error(error):
    message = 'Workbook exceeds the upload size limit.' if error.code == 413 else error.description
    return jsonify(error=message), error.code


@app.get('/health')
def health():
    return jsonify(status='ok')


@app.post('/upload')
def upload():
    file = request.files.get('file')
    if file is None or not file.filename:
        return jsonify(error='Choose an Excel workbook to upload.'), 400
    if Path(file.filename).suffix.lower() not in {'.xlsx', '.xls'}:
        return jsonify(error='Only .xlsx and .xls workbooks are supported.'), 400
    try:
        sheet = request.form.get('sheet')
        rows, diagnostics = normalize_additional_payables(file.stream, sheet_name=sheet if sheet is not None else 0)
    except ImportError:
        app.logger.exception('Missing Excel reader dependency')
        return jsonify(error='Excel support is missing. Install backend requirements.'), 500
    except Exception as error:
        app.logger.info('Workbook parsing failed: %s', error)
        return jsonify(error='Could not parse this workbook. Check the sheet and required headers (DATE, REFERENCE, PAYEE, BUS).'), 400
    # Pandas serialization converts NaN/NaT to JSON null rather than invalid JSON.
    exported = rows.copy()
    exported['DATE'] = pd.to_datetime(exported['DATE'], errors='coerce').dt.strftime('%Y-%m-%d')
    meta = {key: json.loads(value.to_json(orient='records', date_format='iso'))
            if isinstance(value, pd.DataFrame) else value for key, value in diagnostics.items()}
    return jsonify(rows=json.loads(exported.to_json(orient='records')), diagnostics=meta)


@app.get('/')
def index():
    return send_from_directory(FRONTEND, 'index.html')


@app.get('/<path:name>')
def assets(name):
    return send_from_directory(FRONTEND, name)


if __name__ == '__main__':
    app.run(host=os.getenv('HOST', '127.0.0.1'), port=int(os.getenv('PORT', '5000')), debug=False)
