'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const useragent = require('express-useragent');

const Glob = require('../lib/glob');
const Logger = require('@freightwise/logger');
const log = Logger.createLogger('Express');

module.exports = function () {
    const app = express();

    app.use(compression());

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.set('trust proxy', true); // Trust NGINX reverse proxy
    app.use(cors()); // Set cors headers
    app.use(helmet()); // Security middlewares

    app.use(useragent.express());
    app.use(Logger.createMiddleware()); // HTTP request logger

    // Routes
    Glob.getGlobbedFilesSync(__dirname + '/../routes/*.js').forEach(function (
        routePath,
    ) {
        app.use(require(routePath));
    });

    // Handle Errors
    app.use(function (req, res) {
        return res.status(404).send({ message: 'Not Found' });
    });

    // next unused but required for express error handler
    // eslint-disable-next-line no-unused-vars
    app.use(function (err, req, res, next) {
        log.error(err);
        res.status(400).send({ message: err.message });
    });

    return app;
};
