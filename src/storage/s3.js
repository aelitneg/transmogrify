'use strict';

const { S3: AwsS3 } = require('aws-sdk');
const { PassThrough } = require('stream');
const Storage = require('./storage');
const StorageException = require('../models/storageException');

const log = require('@freightwise/logger').createLogger('S3');

class S3 extends Storage {
    constructor(name = 'S3') {
        super(name);
    }

    /**
     * Perform any storage driver specific initialization
     * @param {Object} config
     */
    initialize(config) {
        if (!config.bucket || !config.key) {
            throw new StorageException(
                `Storage to ${this.name} requires "bucket" and "key" properties`,
                400,
            );
        }

        const { accessKeyId, secretAccessKey, sessionToken, region } = config;

        this.s3 = new AwsS3({
            accessKeyId,
            secretAccessKey,
            sessionToken,
            region,
        });

        this.bucket = config.bucket;
        this.key = config.key;
        this.metadata = config.metadata;
        this.wait = config.wait;
    }

    /**
     * Save taskResult to S3.
     * @param {import('../adapters/adapter').TaskResult} taskResult
     * @param {import('../models/task').Task} task
     */
    async save(taskResult, task) {
        const key = this.parseFilename(task.outputFormat, taskResult.archive);

        const fileStream = new PassThrough();

        log.info(`Uploading file: ${this.bucket}/${key}`);
        taskResult.files = [key];
        const promise = this.s3
            .upload({
                Bucket: this.bucket,
                Key: key,
                Body: fileStream,
                ContentType: this.getContentType(
                    task.outputFormat,
                    taskResult.archive,
                ),
                Metadata: this.metadata,
            })
            .promise();

        taskResult.data.pipe(fileStream);

        await promise;
        log.info(`Upload complete ${this.bucket}/${key}`);
    }

    /**
     * Parse a filename based on the output format.
     * @param {String} outputFormat
     * @param {Boolean} archive
     */
    parseFilename(outputFormat, archive = false) {
        const ext = archive ? 'zip' : outputFormat;

        const key = this.key.substr(0, this.key.lastIndexOf('.'));

        return `${key}.${ext}`;
    }

    /**
     * Get text for ContentType header from outputFormat.
     * @param {String} outputFormat
     * @param {Boolean} archive
     */
    getContentType(outputFormat, archive = false) {
        if (archive) {
            return 'application/zip';
        }

        switch (outputFormat) {
            case 'png':
                return `image/${outputFormat}`;
            case 'pdf':
                return `application/pdf`;
            default:
                log.error(
                    `Unable to set ContentType from outputFormat ${outputFormat}`,
                );
                return undefined;
        }
    }
}

module.exports = S3;
