'use strict';

const TransmogrifyException = require('./transmogrifyException');

class AdapterException extends TransmogrifyException {
    /**
     * @param {String} message
     * @param {Number} statusCode
     */
    constructor(message, statusCode) {
        super(message, statusCode);

        this.name = 'Adapter Exception';
    }
}

module.exports = AdapterException;
