'use strict';

const Axios = require('axios').default;
const AdapterException = require('../models/adapterException');

const log = require('@freightwise/logger').createLogger('Adapter');

/**
 * @typedef TaskResult
 * @type {Object}
 * @property {ReadableStream} data
 * @property {Boolean} [archive]
 * @property {Array<String>} [files]
 */

class Adapter {
    constructor(name) {
        this.name = name;
    }

    convert() {
        throw new Error(`${this.name}.convert() is not implemented.`);
    }

    /**
     * Get the media to be converted.
     * @param {String} input
     * @param {String} file
     */
    getMedia(input, file) {
        switch (input) {
            case 'download':
                return this.getMediaFromUrl(file);
            default:
                throw new AdapterException(`Unknown input ${input}`, 400);
        }
    }

    /**
     * Get media from a url.
     * @param {String} url
     */
    async getMediaFromUrl(url) {
        try {
            return await Axios.get(url, { responseType: 'stream' }).then(
                (res) => res.data,
            );
        } catch (error) {
            if (error.isAxiosError) {
                log.warn(
                    'getMediaFromUrl',
                    `${error.response.status} - ${error.response.statusText}`,
                );
                throw new AdapterException(
                    'Unable to retrieve media from input.',
                    400,
                );
            }

            throw error;
        }
    }

    /**
     * Parse ImageMagick command.
     * @param {String} command
     */
    parseCommand(command = '') {
        let [input, output] = command.split('{INPUT_FILE}');

        input = input.split(' ').map((c = '') => c.trim());

        output = output
            ? output
                  .replace('{OUTPUT_FILE}', '')
                  .split(' ')
                  .map((c = '') => c.trim())
            : [''];

        return {
            input,
            output,
        };
    }
}

module.exports = Adapter;
