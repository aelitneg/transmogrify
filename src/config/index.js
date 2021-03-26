'use strict';

require('dotenv').config();

module.exports = {
    puppeteer: {
        args: ['--headless', '--disable-gpu', '--disable-dev-shm-usage'],
    },
    server: {
        port: process.env.PORT || 8080,
        host: process.env.HOST || '0.0.0.0',
    },
};
