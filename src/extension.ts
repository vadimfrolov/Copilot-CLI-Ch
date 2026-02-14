import * as vscode from 'vscode';
import { runAxeTest } from './axeRunner';
import { generateHtmlReport } from './reportGenerator';
import { AxeTestPanelProvider } from './axeTestPanel';

export function activate(context: vscode.ExtensionContext) {
    // Register the sidebar panel
    const provider = new AxeTestPanelProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('axeTestPanel', provider)
    );

    // Register the command (for command palette access)
    const disposable = vscode.commands.registerCommand('axe-accessibility-checker.runTest', async () => {
        try {
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Running Axe Accessibility Test',
                    cancellable: false
                },
                async (progress) => {
                    progress.report({ message: 'Extracting URL from browser...' });
                    
                    const url = await extractUrlFromBrowser();
                    if (!url) {
                        vscode.window.showErrorMessage('No URL found. Please open a URL in the integrated browser.');
                        return;
                    }

                    progress.report({ message: `Testing ${url}...` });
                    const results = await runAxeTest(url);

                    progress.report({ message: 'Generating report...' });
                    const { reportPath, reportHtml } = await generateHtmlReport(results, url);

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
                        vscode.window.showWarningMessage(`Found ${violationCount} accessibility violation(s). Report opened in ${reportPath}`);
                    }
                }
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Axe test failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    context.subscriptions.push(disposable);
}

async function extractUrlFromBrowser(): Promise<string | null> {
    // Try to get URL from active webview panel
    // VS Code's Simple Browser doesn't expose direct API, so we'll use a workaround
    
    // Method 1: Check if there's a simple browser webview
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        const uri = activeEditor.document.uri;
        if (uri.scheme === 'http' || uri.scheme === 'https') {
            return uri.toString();
        }
    }

    // Method 2: Ask user for URL input as fallback
    const url = await vscode.window.showInputBox({
        prompt: 'Enter the URL to test (or open URL in Simple Browser first)',
        placeHolder: 'https://example.com',
        validateInput: (value) => {
            if (!value) {
                return 'URL is required';
            }
            try {
                new URL(value);
                return null;
            } catch {
                return 'Please enter a valid URL';
            }
        }
    });

    return url || null;
}

export function deactivate() {}
