'use strict';

const Config = require('./config');
const log = require('@freightwise/logger').createLogger('Transmogrify');

const app = require('./config/express')();

// Start express app
app.listen(Config.server.port, Config.server.host, function () {
    log.info(`Listening on port ${Config.server.port}. PID: ${process.pid}`);
});

// Catch unhandled errors and bail
process.on('unhandledRejection', (err) => {
    log.error('Unhandled Rejection', err);
    process.exit(1);
});

// Catch promises that are incorrectly handled
process.on('multipleResolves', (type, promise, reason) => {
    log.warn('Multiple Resolves', { type, promise, reason });
    // TODO:  FIX WHEN PUPPETEER FIXES https://github.com/puppeteer/puppeteer/issues/5547
    // log.error('Multiple Resolves', { type, promise, reason });
    // setImmediate(() => process.exit(1));
});
