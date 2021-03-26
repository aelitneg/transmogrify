'use strict';

const TransmogrifyException = require('./transmogrifyException');

class StorageException extends TransmogrifyException {
    /**
     * @param {String} message
     * @param {Number} statusCode
     */
    constructor(message, statusCode) {
        super(message, statusCode);

        this.name = 'Storage Exception';
    }
}

module.exports = StorageException;
