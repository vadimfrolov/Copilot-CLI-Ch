import puppeteer, { Browser } from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { AxeResults } from 'axe-core';

export async function runAxeTest(url: string): Promise<AxeResults> {
    let browser: Browser | null = null;
    
    try {
        browser = await puppeteer.launch({
            headless: true
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        const results = await new AxePuppeteer(page).analyze();

        return results;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
