'use strict';

const TransmogrifyException = require('./transmogrifyException');

class TaskException extends TransmogrifyException {
    /**
     * @param {String} message
     * @param {Number} statusCode
     */
    constructor(message, statusCode) {
        super(message, statusCode);

        this.name = 'Task Exception';
    }
}

module.exports = TaskException;
