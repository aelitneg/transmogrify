'use strict';

const log = require('@freightwise/logger').createLogger('Convert');
const Adapters = require('../adapters');
const Task = require('../models/task');
const TransmogrifyException = require('../models/transmogrifyException');

class ConvertController {
    static async convert(req, res) {
        let waiting = true; // Needed to return error error responses before conversion

        try {
            if (req.body.requestId) {
                log.info(`Processing requestId: ${req.body.requestId}`);
            }

            const task = new Task(req.body);

            // Validation
            const adapter = Adapters.getAdapter(
                task.inputFormat,
                task.outputFormat,
            );

            waiting =
                task.download || task.storage.filter((s) => s.wait).length;

            // Short circuit if not waiting for any results
            if (!waiting) {
                res.status(200).send({});
            }

            // Conversion
            const taskResult = await adapter.convert(task);

            const waits = []; // Promises to await before returning response

            // Output
            if (task.download) {
                const promise = new Promise((resolve, reject) => {
                    taskResult.data.once('error', (error) => {
                        log.error(error);
                        return reject(error);
                    });

                    log.info('Streaming taskResult as resonse');

                    res.setHeader(
                        'content-type',
                        ConvertController._getContentType(task, taskResult),
                    );

                    taskResult.data.pipe(res);
                });

                waits.push(promise);
            }

            // Storage
            for (const storage of task.storage) {
                const promise = storage.save(taskResult, task);

                if (storage.wait) {
                    waits.push(promise);
                }
            }

            await Promise.all(waits);

            if (waiting) {
                if (taskResult.files) {
                    res.setHeader(
                        'x-tm-files',
                        JSON.stringify(taskResult.files),
                    );
                }

                return res.status(200).send({});
            }
        } catch (error) {
            if (error instanceof TransmogrifyException) {
                log.warn(error.message);
                if (waiting) {
                    return res
                        .status(error.statusCode)
                        .send({ message: error.message });
                }
            }

            log.error(error);
            if (waiting) {
                res.status(500).send({
                    message: 'Internal Server Error',
                });
            }
        }
    }

    static _getContentType(task, taskResult) {
        if (taskResult.archive) {
            return 'application/zip';
        }

        switch (task.outputFormat) {
            case 'pdf':
                return 'application/pdf';
            default:
                return `image/${task.outputFormat}`;
        }
    }
}

module.exports = ConvertController;
