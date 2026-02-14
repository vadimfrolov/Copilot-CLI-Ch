# Axe Accessibility Checker for VS Code

<img width="1655" height="1038" alt="Screenshot 2026-02-14 at 20 07 24" src="https://github.com/user-attachments/assets/4cb8f394-deeb-4c64-b8e1-12c32daa7ba1" />


[![Demo Video]([https://www.youtube.com/watch?v=dQw4w9WgXcQ](https://www.youtube.com/watch?v=EGCAbgW5TVA))

A VS Code extension that runs axe-core accessibility tests on URLs opened in VS Code's integrated browser (Simple Browser). Get detailed HTML reports of accessibility violations right in your editor.

## Features

- 🔍 Run axe-core accessibility audits on any webpage
- 📊 Generate beautiful HTML reports with violation details
- ⚡ Quick command palette integration
- 🎯 Categorizes violations by severity (critical, serious, moderate, minor)
- 📝 Includes remediation guidance and help links
- 💾 Saves reports to `axe-reports/` folder with timestamps

## Installation

### From Source

1. Clone this repository
2. Run `npm install` (this will download Chromium for Puppeteer - takes ~10 minutes)
3. Run `npm run compile`
4. Open this folder in VS Code
5. Press **Fn+F5** (macOS) or **F5** (Windows/Linux) to launch the Extension Development Host
   - Or use menu: Run > Start Debugging

### Manual Installation

1. Package the extension: `npx vsce package`
2. Install the .vsix file in VS Code: Extensions > ... > Install from VSIX

## Usage

1. Open a URL in VS Code (or have one ready to paste)
2. Open the Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
3. Run command: **"Run Axe Accessibility Test"**
4. Enter the URL you want to test (or it will be detected automatically if available)
5. Wait for the test to complete
6. The HTML report will open automatically in VS Code

### Reports

Reports are saved to `axe-reports/` in your workspace folder with timestamps:
```
axe-reports/
  axe-report-2026-02-14_14-30-25.html
  axe-report-2026-02-14_15-45-10.html
```

Each report includes:
- Summary of violations, passes, incomplete checks, and inapplicable rules
- Detailed violation information with:
  - Impact level (critical, serious, moderate, minor)
  - Description and remediation guidance
  - Affected HTML elements
  - Links to axe documentation

## Requirements

- VS Code 1.85.0 or higher
- Node.js (for development)

## Extension Settings

This extension does not currently add any VS Code settings.

## Known Issues

- VS Code's Simple Browser doesn't expose a direct API, so users need to manually enter the URL
- Puppeteer downloads a full Chromium browser (~170MB) during installation

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Launch Extension Development Host
# Press Fn+F5 (macOS) or F5 (Windows/Linux)
# Or use menu: Run > Start Debugging

# Package extension
npx vsce package
```

## How It Works

1. Takes a URL as input
2. Launches headless Chromium using Puppeteer
3. Runs axe-core accessibility analysis
4. Generates an HTML report with all findings
5. Saves report to workspace and opens in editor

## Dependencies

- **@axe-core/puppeteer** - Axe accessibility testing engine for Puppeteer
- **puppeteer** - Headless Chrome browser automation

## License

MIT

## Credits

Built with:
- [axe-core](https://github.com/dequelabs/axe-core) by Deque Systems
- [Puppeteer](https://pptr.dev/) by Google Chrome team
