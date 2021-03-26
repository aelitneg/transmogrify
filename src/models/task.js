'use strict';

const log = require('@freightwise/logger').createLogger('Task');
const { getStorage } = require('../storage');
const TaskException = require('./taskException');

/**
 * @typedef ConverterOptions
 * @type {Object}
 * @property {String} command
 */

/**
 * @typedef Task
 * @type {Object}
 * @property {String} input
 * @property {String} inputFormat
 * @property {String} [file]
 * @property {ConverterOptions} [converterOptions]
 * @property {String} outputFormat
 * @property {String} [download]
 * @property {Array} [storage] Array of Storage instances
 * @property {String} [requestId]
 */

class Task {
    /**
     * Create a new task from request body data.
     * @param {Object} reqBody
     */
    constructor(reqBody) {
        this._parseInputParams(reqBody);

        this.converterOptions = reqBody.converterOptions || {};

        this._parseOutputParams(reqBody);
        this._parseStorageParams(reqBody);

        this.requestId = reqBody.requestId;
    }

    _parseInputParams(reqBody) {
        if (!reqBody.input) {
            log.warn('Missing required parameter: input');
            throw new TaskException('Missing required parameter: input', 400);
        } else if (!reqBody.inputFormat) {
            log.warn('Missing required parameter: inputFormat');
            throw new TaskException(
                'Missing required parameter: inputFormat',
                400,
            );
        }

        this.input = reqBody.input;
        this.inputFormat = reqBody.inputFormat;
        this.file = reqBody.file;
    }

    _parseOutputParams(reqBody) {
        if (!reqBody.outputFormat) {
            log.warn('Missing required parameter: outputFormat');
            throw new TaskException(
                'Missing required parameter: outputFormat',
                400,
            );
        }

        this.outputFormat = reqBody.outputFormat;
        this.download = reqBody.download;
    }

    _parseStorageParams(reqBody) {
        this.storage = [];

        if (!reqBody.storage) {
            return;
        }

        const storage = Array.isArray(reqBody.storage)
            ? reqBody.storage
            : [reqBody.storage];

        storage.forEach((s) => {
            this.storage.push(getStorage(s));
        });
    }
}

module.exports = Task;
