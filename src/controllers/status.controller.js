'use strict';

const path = require('path');
const Gm = require('gm').subClass({ imageMagick: true });
const BrowserFactory = require('../lib/browserFactory');
const log = require('@freightwise/logger').createLogger('Status');

const browserFactory = new BrowserFactory();

class StatusController {
    static async getStatus(req, res) {
        const imageMagick = await StatusController._getImageMagickStatus();
        const puppeteer = await StatusController._getPuppeteerStatus();

        const status = {
            imageMagick,
            puppeteer,
        };

        status.ready = imageMagick.ready && puppeteer.ready;
        status.code = status.ready ? 200 : 503;

        return res.status(status.code).send({ status });
    }

    static async _getImageMagickStatus() {
        const status = await new Promise((resolve) => {
            try {
                const image = Gm(
                    path.resolve(process.cwd(), './test/samples/minimal.png'),
                );

                image.identify('%m', (err, format) => {
                    if (err) {
                        log.error('_getImageMagickStatus', err);
                        resolve(false);
                    }

                    resolve(format.toLowerCase() === 'png');
                });
            } catch (error) {
                log.error('_getImageMagickStatus', error);
                resolve(false);
            }
        });

        return {
            ready: !!status,
            code: status ? 200 : 503,
        };
    }

    static async _getPuppeteerStatus() {
        let status = {
            ready: null,
            code: null,
        };

        try {
            const browser = await browserFactory.getBrowser();
            const isConnected = browser.isConnected();

            if (!isConnected) {
                throw new Error('Puppeteer is not connected to Chromium.');
            }

            status.ready = true;
            status.code = 200;

            return status;
        } catch (error) {
            log.error('_getPuppeteerStatus', error);

            status.ready = false;
            status.code = 503;

            return status;
        }
    }
}

module.exports = StatusController;
