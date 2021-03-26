'use strict';

const log = require('@freightwise/logger').createLogger('Adapter - index.js');
const AdapterException = require('../models/adapterException');

const adapters = [
    {
        name: 'HtmlToPdf',
        inputFormats: ['html'],
        outputFormats: ['pdf'],
        adapter: require('./htmlToPdf'),
    },
    {
        name: 'ImageToImage',
        inputFormats: ['png'],
        outputFormats: ['png'],
        adapter: require('./imageToImage'),
    },
    {
        name: 'PdfToImage',
        inputFormats: ['pdf'],
        outputFormats: ['png'],
        adapter: require('./pdfToImage'),
    },
];

module.exports = {
    /**
     * Get an adapter suitable for requested formats.
     * @param {String} inputFormat
     * @param {String} outputFormat
     */
    getAdapter: function (inputFormat, outputFormat) {
        const [adapter] = adapters.filter(function (adapter) {
            return (
                adapter.inputFormats.includes(inputFormat) &&
                adapter.outputFormats.includes(outputFormat)
            );
        });

        if (!adapter) {
            log.warn(
                `Conversion from ${inputFormat} to ${outputFormat} is not supported.`,
            );

            throw new AdapterException(
                `Conversion from ${inputFormat} to ${outputFormat} is not supported.`,
                400,
            );
        }

        return new adapter.adapter();
    },
};
