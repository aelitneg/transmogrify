'use strict';

const { Readable } = require('stream');

const Adapter = require('./adapter');
const AdapterException = require('../models/adapterException');
const BrowserFactory = require('../lib/browserFactory');
const { createLogger } = require('@freightwise/logger');

const WaitForNetworkIdle = require('../lib/waitForNetworkIdle');

const log = createLogger('HtmlToPdf');
const vuelog = createLogger('Vue Console');

const browserFactory = new BrowserFactory();

const DEFAULT_PDF_OPTIONS = Object.freeze({
    format: 'Letter',
    printBackground: true,
});

class HtmlToPdf extends Adapter {
    constructor() {
        super('HtmlToPdf');
    }

    /**
     * Convert HTML to PDF.
     * @param {import('../models/task').Task} task
     */
    async convert(task) {
        // Get an instance of the Puppeteer browser and create a new page
        const browser = await browserFactory.getBrowser();
        const page = await browser.newPage();

        try {
            // Redirect the puppeteer console logs to our logging console
            page.on('console', (msg) =>
                (
                    vuelog[msg.type() === 'log' ? 'debug' : msg.type()] ||
                    vuelog.debug
                )(msg.text()),
            );

            // Kick off page load and listen for console errors
            await Promise.race([
                new Promise((resolve, reject) => {
                    const consoleHandler = (msg) => {
                        if (msg.type() === 'error') {
                            page.removeListener('console', consoleHandler);

                            log.warn('Page load error: ' + msg.text());
                            reject(
                                new AdapterException(
                                    'Page load error: ' + msg.text(),
                                    400,
                                ),
                            );
                        }
                    };

                    page.on('console', consoleHandler);
                }),

                page.goto(task.file).catch((error) => {
                    log.warn('Page load error: ' + error);
                    throw new AdapterException('Page load error' + error, 400);
                }),
            ]);

            // Wait for page to complete loading
            await this._waitForPageLoad(page);

            // Generate the final PDF and return as a stream
            const pdfOptions = this._parsePdfOptions(task.converterOptions);
            return { data: Readable.from(await page.pdf(pdfOptions)) };
        } finally {
            if (browser !== null) {
                await page.close();
            }
        }
    }

    /**
     * Wait for page to complete loading.
     * The page is considered 'loaded' when the size of the rendered PDF is reasonable. When rendering, the headers
     * and footers are excluded because they artificially inflate the size of the page rendered by the browser.
     * @param {Page} page
     */
    async _waitForPageLoad(page) {
        await WaitForNetworkIdle(page, 400);

        let pdf = await page.pdf();
        if (pdf.length > 2000) {
            return;
        }

        await WaitForNetworkIdle(page, 2000);

        pdf = await page.pdf();
        if (pdf.length > 2000) {
            return;
        }

        throw new AdapterException('The PDF build timed out.', 500);
    }

    /**
     * Set document options for PDF.
     * @param {Object} converterOptions
     */
    _parsePdfOptions(converterOptions) {
        // Clone default options
        const pdfOptions = {
            ...DEFAULT_PDF_OPTIONS,
        };

        // Set some properties based on converterOptions for convenience
        if (
            converterOptions &&
            (converterOptions.width || converterOptions.height)
        ) {
            delete pdfOptions.format;
        }

        if (
            converterOptions &&
            (converterOptions.headerTemplate || converterOptions.footerTemplate)
        ) {
            pdfOptions.displayHeaderFooter = true;
        }

        // Merge defaults with converterOptions
        return {
            ...pdfOptions,
            ...converterOptions,
        };
    }
}

module.exports = HtmlToPdf;
