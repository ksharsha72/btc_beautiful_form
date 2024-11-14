from flask import Flask, render_template, request, send_file, jsonify
from playwright.sync_api import sync_playwright
import os
import tempfile
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('form.html')

@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        # Get HTML content from request
        html_content = request.json.get('html')
        
        # Create a temporary file to store the PDF
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pdf_path = os.path.join(tempfile.gettempdir(), f'project_review_{timestamp}.pdf')
        
        # Generate PDF using Playwright
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.set_content(html_content)
            page.pdf(path=pdf_path, format="A4", margin={
                "top": "20mm",
                "bottom": "20mm",
                "left": "20mm",
                "right": "20mm"
            })
            browser.close()
        
        # Send the PDF file
        return send_file(
            pdf_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'project_review_{timestamp}.pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001) 