'use strict';

const { PassThrough } = require('stream');
const unzipper = require('unzipper');
const S3 = require('./s3');

const log = require('@freightwise/logger').createLogger('S3MultiFile');

class S3MultiFile extends S3 {
    constructor() {
        super('S3 Multi File');
    }

    /**
     * Save taskResult to S3 as multiple files.
     * @param {import('../adapters/adapter').TaskResult} taskResult
     * @param {import('../models/task').Task} task
     */
    async save(taskResult, task) {
        // If not working with a zip, we can use regular S3 storage
        if (!taskResult.archive) {
            return super.save(taskResult, task);
        }

        const uploads = [];
        taskResult.files = [];
        const contentType = this.getContentType(task.outputFormat);

        const zip = taskResult.data.pipe(unzipper.Parse({ forceStream: true }));
        for await (const entry of zip) {
            let path = this.key.includes('/')
                ? this.key.substr(0, this.key.lastIndexOf('/') + 1)
                : '';
            const key = `${path}${entry.path}`;

            const fileStream = new PassThrough();

            log.info(`Uploading ${key} to S3`);
            taskResult.files.push(key);
            uploads.push(
                this.s3
                    .upload({
                        Bucket: this.bucket,
                        Key: key,
                        Body: fileStream,
                        ContentType: contentType,
                        Metadata: this.metadata,
                    })
                    .promise(),
            );

            entry.pipe(fileStream);
        }

        await Promise.all(uploads);
        log.info(`All uploads complete`);
    }
}

module.exports = S3MultiFile;
