document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reviewForm');
    
    // Code Review Radio Buttons
    const codeReviewRadios = document.querySelectorAll('input[name="codeReview"]');
    const approverSection = document.querySelector('.approver-section');
    
    codeReviewRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            approverSection.style.display = this.value === 'pass' ? 'block' : 'none';
        });
    });

    // Sonar Qube Radio Buttons
    const sonarRadios = document.querySelectorAll('input[name="sonarQube"]');
    const sonarFileSection = document.querySelector('.sonar-file-section');
    
    sonarRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            sonarFileSection.style.display = 'block';
        });
    });

    // Conditional Approval Radio Buttons
    const approvalRadios = document.querySelectorAll('input[name="approvalType"]');
    const issuesSection = document.querySelector('.issues-section');
    
    approvalRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            issuesSection.style.display = this.value === 'conditional' ? 'block' : 'none';
        });
    });

    // Priority/Severity Checkboxes
    const priorityCheck = document.querySelector('input[name="priorityIssues"]');
    const severityCheck = document.querySelector('input[name="severityIssues"]');
    const priorityValues = document.querySelector('.priority-values');
    const severityValues = document.querySelector('.severity-values');
    
    priorityCheck.addEventListener('change', function() {
        priorityValues.style.display = this.checked ? 'block' : 'none';
    });
    
    severityCheck.addEventListener('change', function() {
        severityValues.style.display = this.checked ? 'block' : 'none';
    });

    // Test Numbers Validation
    const totalTests = document.querySelector('input[name="totalTests"]');
    const testsExecuted = document.querySelector('input[name="testsExecuted"]');
    const testsPassed = document.querySelector('input[name="testsPassed"]');
    const testsFailed = document.querySelector('input[name="testsFailed"]');

    function validateTestNumbers() {
        const total = parseInt(totalTests.value) || 0;
        const executed = parseInt(testsExecuted.value) || 0;
        const passed = parseInt(testsPassed.value) || 0;
        const failed = parseInt(testsFailed.value) || 0;

        if (executed > total) {
            testsExecuted.classList.add('is-invalid');
            return false;
        }

        if (passed + failed !== executed) {
            testsPassed.classList.add('is-invalid');
            testsFailed.classList.add('is-invalid');
            return false;
        }

        testsExecuted.classList.remove('is-invalid');
        testsPassed.classList.remove('is-invalid');
        testsFailed.classList.remove('is-invalid');
        return true;
    }

    [totalTests, testsExecuted, testsPassed, testsFailed].forEach(input => {
        input.addEventListener('input', validateTestNumbers);
    });

    // Form Submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateTestNumbers()) {
            alert('Please check the test numbers');
            return;
        }

        const requiredFields = Array.from(form.elements).filter(element => {
            return element.hasAttribute('required') && 
                   element.type !== 'file' && 
                   !element.value.trim();
        });

        if (requiredFields.length > 0) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        // Show loading indicator
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating PDF...';

        try {
            const formData = new FormData(form);
            const htmlContent = generatePDFContent(formData);

            // Send HTML content to server
            const response = await fetch('/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ html: htmlContent }),
            });

            if (!response.ok) {
                throw new Error('PDF generation failed');
            }

            // Convert response to blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `project_review_${new Date().toISOString().slice(0,10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });

    function generatePDFContent(formData) {
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                .section { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
                .section-title { color: #333; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                .field { margin-bottom: 8px; }
                .field-label { font-weight: bold; color: #555; }
                .field-value { margin-left: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
                .file-info { 
                    color: #0066cc; 
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 style="text-align: center; color: #333; margin-bottom: 30px;">Project Review Report</h1>
                
                <div class="section">
                    <div class="section-title">Project Details</div>
                    <div class="field">
                        <span class="field-label">Project:</span>
                        <span class="field-value">${formData.get('project')}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Sprint:</span>
                        <span class="field-value">${formData.get('sprint')}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Duration:</span>
                        <span class="field-value">${formData.get('startDate')} to ${formData.get('endDate')}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Code Review</div>
                    <div class="field">
                        <span class="field-label">Status:</span>
                        <span class="field-value">${formData.get('codeReview')}</span>
                    </div>
                    ${formData.get('approverName') ? `
                    <div class="field">
                        <span class="field-label">Approver:</span>
                        <span class="field-value">${formData.get('approverName')}</span>
                    </div>` : ''}
                </div>

                <div class="section">
                    <div class="section-title">Sonar Qube Report</div>
                    <div class="field">
                        <span class="field-label">Status:</span>
                        <span class="field-value">${formData.get('sonarQube')}</span>
                    </div>
                    ${formData.get('sonarReport')?.name ? `
                    <div class="field">
                        <span class="field-label">Report File:</span>
                        <span class="field-value file-info">${formData.get('sonarReport').name}</span>
                    </div>` : ''}
                </div>

                <div class="section">
                    <div class="section-title">VAPT Report</div>
                    ${Array.from(formData.getAll('vaptReport'))
                        .filter(file => file.name)
                        .map(file => `
                            <div class="field">
                                <span class="field-label">File:</span>
                                <span class="field-value file-info">${file.name}</span>
                            </div>
                        `).join('')}
                </div>

                <div class="section">
                    <div class="section-title">Test Results Summary</div>
                    <div class="field">
                        <span class="field-label">Approval Type:</span>
                        <span class="field-value">${formData.get('approvalType') === 'conditional' ? 
                            'Conditional Approval' : 'Non-Conditional Approval'}</span>
                    </div>
                    <table>
                        <tr>
                            <th>Total Tests</th>
                            <th>Executed</th>
                            <th>Passed</th>
                            <th>Failed</th>
                        </tr>
                        <tr>
                            <td>${formData.get('totalTests')}</td>
                            <td>${formData.get('testsExecuted')}</td>
                            <td>${formData.get('testsPassed')}</td>
                            <td>${formData.get('testsFailed')}</td>
                        </tr>
                    </table>
                </div>`;

            // Add Priority Issues if present
            if (formData.get('priorityIssues')) {
                html += `
                    <div class="section">
                        <div class="section-title">Priority Issues</div>
                        <table>
                            <tr>
                                <th>P0</th>
                                <th>P1</th>
                                <th>P2</th>
                                <th>P3</th>
                            </tr>
                            <tr>
                                <td>${formData.get('p0') || '0'}</td>
                                <td>${formData.get('p1') || '0'}</td>
                                <td>${formData.get('p2') || '0'}</td>
                                <td>${formData.get('p3') || '0'}</td>
                            </tr>
                        </table>
                    </div>`;
            }

            // Add Severity Issues if present
            if (formData.get('severityIssues')) {
                html += `
                    <div class="section">
                        <div class="section-title">Severity Issues</div>
                        <table>
                            <tr>
                                <th>S0</th>
                                <th>S1</th>
                                <th>S2</th>
                                <th>S3</th>
                            </tr>
                            <tr>
                                <td>${formData.get('s0') || '0'}</td>
                                <td>${formData.get('s1') || '0'}</td>
                                <td>${formData.get('s2') || '0'}</td>
                                <td>${formData.get('s3') || '0'}</td>
                            </tr>
                        </table>
                    </div>`;
            }

            html += `
                <div class="section">
                    <div class="section-title">Reference Links</div>
                    <div class="field">
                        <span class="field-label">PR URL:</span>
                        <span class="field-value"><a href="${formData.get('prUrl')}">${formData.get('prUrl')}</a></span>
                    </div>
                    <div class="field">
                        <span class="field-label">Commit ID:</span>
                        <span class="field-value">${formData.get('commitId')}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Redmine URL:</span>
                        <span class="field-value"><a href="${formData.get('redmineUrl')}">${formData.get('redmineUrl')}</a></span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Report Generation Info</div>
                    <div class="field">
                        <span class="field-label">Generated On:</span>
                        <span class="field-value">${new Date().toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        return html;
    }
}); 