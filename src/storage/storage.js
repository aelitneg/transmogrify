'use strict';

const log = require('@freightwise/logger').createLogger('Storage');

class Storage {
    constructor(name) {
        this.name = name;
    }

    /**
     * Perform any storage driver specific initialization
     * @param {Object} config
     */
    initialize() {}

    /**
     * Save taskResult to storage.
     * @param {import('../adapters/adapter').TaskResult} taskResult
     * @param {import('../models/task').Task} config
     */
    save() {
        log.error(`Save not implemented for ${this.name}`);
    }

    /**
     * Get filename and extension from task.
     * @param {import('../models/task').Task} task`
     */
    parseFilename() {}
}

module.exports = Storage;
