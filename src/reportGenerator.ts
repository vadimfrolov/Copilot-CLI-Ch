import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { AxeResults } from 'axe-core';

export async function generateHtmlReport(results: AxeResults, url: string): Promise<{ reportPath: string; reportHtml: string }> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    // If no workspace folder, use OS temp directory
    const baseDir = workspaceFolder 
        ? workspaceFolder.uri.fsPath 
        : path.join(os.homedir(), 'axe-accessibility-reports');
    
    const reportsDir = path.join(baseDir, 'axe-reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('Z')[0];
    const reportPath = path.join(reportsDir, `axe-report-${timestamp}.html`);

    const html = generateHtml(results, url);
    await fs.writeFile(reportPath, html, 'utf-8');

    return { reportPath, reportHtml: html };
}

function generateHtml(results: AxeResults, url: string): string {
    const { violations, passes, incomplete, inapplicable } = results;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Axe Accessibility Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .summary-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary-card h3 {
            margin: 0 0 5px 0;
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
        }
        .summary-card .count {
            font-size: 32px;
            font-weight: bold;
        }
        .violations { color: #d32f2f; }
        .passes { color: #388e3c; }
        .incomplete { color: #f57c00; }
        .inapplicable { color: #757575; }
        .violation-list {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .violation-item {
            border-left: 4px solid #d32f2f;
            padding: 15px;
            margin-bottom: 15px;
            background: #fff5f5;
        }
        .violation-item.critical { border-left-color: #d32f2f; background: #ffebee; }
        .violation-item.serious { border-left-color: #f57c00; background: #fff3e0; }
        .violation-item.moderate { border-left-color: #fbc02d; background: #fffde7; }
        .violation-item.minor { border-left-color: #757575; background: #fafafa; }
        .violation-item h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-left: 10px;
        }
        .badge.critical { background: #d32f2f; color: white; }
        .badge.serious { background: #f57c00; color: white; }
        .badge.moderate { background: #fbc02d; color: black; }
        .badge.minor { background: #757575; color: white; }
        .help-text {
            color: #555;
            margin: 10px 0;
        }
        .nodes {
            margin-top: 10px;
            font-size: 14px;
        }
        .node-item {
            background: white;
            padding: 8px;
            margin: 5px 0;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
        .meta {
            color: #666;
            font-size: 14px;
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .empty-state .icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Axe Accessibility Report</h1>
        <div class="meta">
            <strong>URL:</strong> <a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url)}</a><br>
            <strong>Tested:</strong> ${new Date().toLocaleString()}<br>
            <strong>Axe Version:</strong> ${results.testEngine.version}
        </div>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Violations</h3>
            <div class="count violations">${violations.length}</div>
        </div>
        <div class="summary-card">
            <h3>Passes</h3>
            <div class="count passes">${passes.length}</div>
        </div>
        <div class="summary-card">
            <h3>Incomplete</h3>
            <div class="count incomplete">${incomplete.length}</div>
        </div>
        <div class="summary-card">
            <h3>Inapplicable</h3>
            <div class="count inapplicable">${inapplicable.length}</div>
        </div>
    </div>

    <div class="violation-list">
        <h2>Violations (${violations.length})</h2>
        ${violations.length === 0 
            ? '<div class="empty-state"><div class="icon">✓</div><p>No accessibility violations found!</p></div>'
            : violations.map(violation => `
                <div class="violation-item ${violation.impact}">
                    <h3>
                        ${escapeHtml(violation.help)}
                        <span class="badge ${violation.impact}">${violation.impact}</span>
                    </h3>
                    <p class="help-text">${escapeHtml(violation.description)}</p>
                    <p><strong>Impact:</strong> ${violation.impact} | <strong>Tags:</strong> ${violation.tags.join(', ')}</p>
                    <p><strong>Elements affected:</strong> ${violation.nodes.length}</p>
                    <div class="nodes">
                        ${violation.nodes.slice(0, 5).map(node => `
                            <div class="node-item">
                                ${escapeHtml(node.html)}
                                ${node.failureSummary ? `<br><small>${escapeHtml(node.failureSummary)}</small>` : ''}
                            </div>
                        `).join('')}
                        ${violation.nodes.length > 5 ? `<p><em>...and ${violation.nodes.length - 5} more</em></p>` : ''}
                    </div>
                    <p><a href="${violation.helpUrl}" target="_blank">Learn more →</a></p>
                </div>
            `).join('')
        }
    </div>

    ${incomplete.length > 0 ? `
    <div class="violation-list" style="margin-top: 20px;">
        <h2>Incomplete (${incomplete.length})</h2>
        <p style="color: #666;">These items require manual review to determine if they are violations.</p>
        ${incomplete.map(item => `
            <div class="violation-item moderate">
                <h3>${escapeHtml(item.help)}</h3>
                <p class="help-text">${escapeHtml(item.description)}</p>
                <p><strong>Elements to review:</strong> ${item.nodes.length}</p>
                <p><a href="${item.helpUrl}" target="_blank">Learn more →</a></p>
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>`;
}

function escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
