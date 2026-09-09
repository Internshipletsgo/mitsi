import io
import unittest
from datetime import datetime

import pandas as pd
import api


def workbook():
    buffer = io.BytesIO()
    pd.DataFrame([
        ['DATE', 'REFERENCE', 'PAYEE', 'PARTICULARS', 'BUS', '701', '401', 'ACCT', 'Dr', 'Cr'],
        [datetime(2026, 9, 1), 'REF-1', '<img src=x onerror=alert(1)>', 'Supplies', 'BUS-1', 100, 100, None, None, None],
        [datetime(2026, 9, 2), 'REF-2', 'Vendor B', 'Repair', 'BUS-2', 50, 0, '201', 0, 50],
    ]).to_excel(buffer, index=False, header=False)
    buffer.seek(0)
    return buffer


class ConnectionTests(unittest.TestCase):
    def setUp(self):
        self.client = api.app.test_client()

    def test_frontend_and_health(self):
        for path in ['/', '/script.js', '/style.css', '/config.js', '/health']:
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200)
            response.close()

    def test_upload_contract(self):
        response = self.client.post('/upload', data={'file': (workbook(), 'report.xlsx')})
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(len(body['rows']), 4)
        self.assertEqual(body['rows'][0]['DATE'], '2026-09-01')
        self.assertEqual(sum(r['DEBIT'] for r in body['rows']), 150)
        self.assertEqual(sum(r['CREDIT'] for r in body['rows']), 150)
        self.assertEqual(body['diagnostics']['warnings'], [])

    def test_invalid_uploads(self):
        self.assertEqual(self.client.post('/upload').status_code, 400)
        for name in ['report.txt', 'broken.xlsx']:
            response = self.client.post('/upload', data={'file': (io.BytesIO(b'bad'), name)})
            self.assertEqual(response.status_code, 400)
            self.assertTrue(response.get_json()['error'])

    def test_cors(self):
        api.ALLOWED_ORIGINS.add('http://localhost:5500')
        for origin, allowed in [('http://localhost:5500', True), ('http://unlisted.example', False)]:
            response = self.client.options('/upload', headers={'Origin': origin, 'Access-Control-Request-Method': 'POST'})
            self.assertEqual('Access-Control-Allow-Origin' in response.headers, allowed)
        api.ALLOWED_ORIGINS.discard('http://localhost:5500')

    def test_size_limit(self):
        original = api.app.config['MAX_CONTENT_LENGTH']
        try:
            api.app.config['MAX_CONTENT_LENGTH'] = 10
            response = self.client.post('/upload', data={'file': (workbook(), 'report.xlsx')})
            self.assertEqual(response.status_code, 413)
            self.assertIn('error', response.get_json())
        finally:
            api.app.config['MAX_CONTENT_LENGTH'] = original


if __name__ == '__main__':
    unittest.main()
