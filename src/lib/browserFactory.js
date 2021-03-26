'use strict';

const Puppeteer = require('puppeteer');
const Config = require('../config');
const log = require('@freightwise/logger').createLogger('BrowserFactory');

class BrowserFactory {
    constructor() {
        this.browser = null;
        this.initBrowser();
    }

    async initBrowser() {
        this.browser = await Puppeteer.launch({
            args: [
                ...Config.puppeteer.args,
                ...(process.env.PUPPETEER_NO_SANDBOX === 'true'
                    ? ['--no-sandbox']
                    : []),
            ],
        });

        this.browser.on('disconnected', () => {
            log.warn('Puppeteer disconnected - restarting');
            this.browser = null;
            this.initBrowser();
        });
    }

    /**
     * Get an instance of the Puppeteer browser
     */
    async getBrowser() {
        if (!this.browser) {
            await this.initBrowser();
        }

        return this.browser;
    }
}

module.exports = BrowserFactory;
