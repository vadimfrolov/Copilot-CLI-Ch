import * as vscode from 'vscode';
import { runAxeTest } from './axeRunner';
import { generateHtmlReport } from './reportGenerator';

export class AxeTestPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'axeTestPanel';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'runTest':
                    await this._runTest(data.url);
                    break;
                case 'copyPath':
                    await vscode.env.clipboard.writeText(data.path);
                    vscode.window.showInformationMessage('Report path copied to clipboard!');
                    break;
            }
        });
    }

    private async _runTest(url: string) {
        if (!url) {
            vscode.window.showErrorMessage('Please enter a URL');
            return;
        }

        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        try {
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Running Axe Accessibility Test',
                    cancellable: false
                },
                async (progress) => {
                    progress.report({ message: `Testing ${url}...` });
                    const results = await runAxeTest(url);

                    progress.report({ message: 'Generating report...' });
                    const { reportPath, reportHtml } = await generateHtmlReport(results, url);

                    // Send report path back to the webview
                    if (this._view) {
                        this._view.webview.postMessage({
                            type: 'reportGenerated',
                            path: reportPath,
                            violationCount: results.violations.length
                        });
                    }

                    // Create a webview panel to display the HTML report
                    const panel = vscode.window.createWebviewPanel(
                        'axeReport',
                        'Axe Accessibility Report',
                        vscode.ViewColumn.One,
                        {
                            enableScripts: false,
                            retainContextWhenHidden: true
                        }
                    );
                    
                    panel.webview.html = reportHtml;

                    const violationCount = results.violations.length;
                    if (violationCount === 0) {
                        vscode.window.showInformationMessage('✓ No accessibility violations found!');
                    } else {
                        vscode.window.showWarningMessage(`Found ${violationCount} accessibility violation(s). Saved to ${reportPath}`);
                    }
                }
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Axe test failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Axe Accessibility Test</title>
    <style>
        body {
            padding: 10px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo {
            font-size: 48px;
            margin-bottom: 5px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .subtitle {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
        }
        .form-container {
            margin-top: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
        }
        input[type="text"] {
            width: 100%;
            padding: 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 13px;
        }
        input[type="text"]:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }
        button {
            width: 100%;
            margin-top: 12px;
            padding: 10px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        button:active {
            opacity: 0.8;
        }
        .info {
            margin-top: 20px;
            padding: 10px;
            background: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textLink-foreground);
            font-size: 12px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🪓</div>
        <div class="title">A11y Test</div>
        <div class="subtitle">Axe Accessibility Checker</div>
    </div>

    <div class="form-container">
        <label for="urlInput">Enter URL to test:</label>
        <input 
            type="text" 
            id="urlInput" 
            placeholder="https://example.com"
            autocomplete="off"
        />
        <button id="runTestBtn">Run Accessibility Test</button>
    </div>

    <div class="info">
        💡 <strong>Tip:</strong> Enter any URL and press Enter or click the button to run axe-core accessibility tests.
    </div>

    <div class="report-section" id="reportSection">
        <label>Last Report:</label>
        <div id="reportStatus" class="status"></div>
        <div class="report-path">
            <span class="report-path-text" id="reportPath"></span>
            <button class="copy-btn" id="copyBtn" disabled>📋 Copy</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const urlInput = document.getElementById('urlInput');
        const runTestBtn = document.getElementById('runTestBtn');
        const reportSection = document.getElementById('reportSection');
        const reportPath = document.getElementById('reportPath');
        const reportStatus = document.getElementById('reportStatus');
        const copyBtn = document.getElementById('copyBtn');

        function runTest() {
            const url = urlInput.value.trim();
            if (url) {
                vscode.postMessage({
                    type: 'runTest',
                    url: url
                });
            }
        }

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'reportGenerated') {
                reportSection.classList.add('visible');
                reportPath.textContent = message.path;
                copyBtn.disabled = false;
                
                if (message.violationCount === 0) {
                    reportStatus.textContent = '✓ No violations found';
                    reportStatus.className = 'status success';
                } else {
                    reportStatus.textContent = '⚠ Found ' + message.violationCount + ' violation(s)';
                    reportStatus.className = 'status warning';
                }
            }
        });

        copyBtn.addEventListener('click', () => {
            const path = reportPath.textContent;
            if (path) {
                vscode.postMessage({
                    type: 'copyPath',
                    path: path
                });
            }
        });

        runTestBtn.addEventListener('click', runTest);
        
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                runTest();
            }
        });

        // Focus the input on load
        urlInput.focus();
    </script>
</body>
</html>`;
    }
}
