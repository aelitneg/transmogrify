'use strict';

class TransmogrifyException extends Error {
    /**
     * @param {String} message
     * @param {Number} statusCode
     */
    constructor(message, statusCode) {
        super(message);

        this.message = message;
        this.name = 'Transmogrify Exception';
        this.statusCode = statusCode;
    }
}

module.exports = TransmogrifyException;
