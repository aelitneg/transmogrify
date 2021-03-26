'use strict';

const log = require('@freightwise/logger').createLogger('Storage - index.js');
const StorageException = require('../models/storageException');

const storageClasses = [
    {
        type: 's3',
        adapter: require('./s3'),
    },
    {
        type: 's3MultiFile',
        adapter: require('./s3MultiFile'),
    },
];

module.exports = {
    /**
     * Return instance of requested storage class.
     * @param {Object} options
     */
    getStorage: function (config) {
        const [storage] = storageClasses.filter(function (storageClass) {
            return config.type === storageClass.type;
        });

        if (!storage) {
            log.warn(`Unsupported output type: ${config.type}`);
            throw new StorageException(
                `Unsupported output type: ${config.type}`,
                400,
            );
        }

        const instance = new storage.adapter();
        instance.initialize(config);

        return instance;
    },
};
