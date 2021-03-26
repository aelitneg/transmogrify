'use strict';
const { parse } = require('path');
const { PassThrough } = require('stream');
const Archiver = require('archiver');
const Gm = require('gm').subClass({ imageMagick: true });
const Adapter = require('./adapter');
const PdfRepair = require('../lib/pdfRepair');

class PdfToImage extends Adapter {
    constructor() {
        super('PdfToImage');
    }

    /**
     * Perform requested conversion.
     * @param {import('../models/task').Task} conversion
     */
    async convert(task) {
        const image = await this._cleanPdf(task);

        const renderFrames = await this._getRenderFrames(
            image,
            task.converterOptions,
        );

        const { input, output } = this.parseCommand(
            task.converterOptions.command,
        );

        // For multi-page PDF's, compress images and stream zip
        if (renderFrames.length > 1) {
            const archive = Archiver('zip', { zlib: 9 });
            const passThrough = new PassThrough();
            const filename = this._parseFilename(task);

            archive.pipe(passThrough);

            for (const i of renderFrames) {
                archive.append(
                    image
                        .selectFrame(i)
                        .in(...input)
                        .out(...output)
                        .stream(task.outputFormat),
                    {
                        name: `${filename}-${String(i + 1).padStart(2, '0')}.${
                            task.outputFormat
                        }`,
                    },
                );
            }

            archive.finalize();
            return { data: passThrough, archive: true };
        }

        // For single page, stream image
        return {
            data: image
                .in(...input)
                .out(...output)
                .stream(task.outputFormat),
        };
    }

    /**
     * Check if PDF is well formed and attempt to repair.
     * @param {import('../models/task').Task} task
     */
    async _cleanPdf(task) {
        const image = Gm(await this.getMedia(task.input, task.file));

        return new Promise((resolve, reject) => {
            // Attempty a simple identify command
            image.identify({ bufferStream: true }, (err) => {
                if (
                    err &&
                    err.message.startsWith('Command failed: identify:')
                ) {
                    // If identify fails, attempt to repair the PDF.  When the command fails, the stream is
                    // broken, so stream download again.
                    return this.getMedia(task.input, task.file)
                        .then((data) => {
                            return PdfRepair.run(data);
                        })
                        .then((pdfStream) => {
                            return resolve(Gm(pdfStream));
                        })
                        .catch((error) => {
                            reject(error);
                        });
                }

                // If identify is successful, return the image object
                return resolve(image);
            });
        });
    }

    /**
     * Determine the image frames to render.
     * @param {*} image Gm Image Object
     * @param {*} converterOptions
     */
    async _getRenderFrames(image, converterOptions) {
        function range(from, to) {
            return [...Array(to - from + 1)].map((_, i) => from + i - 1);
        }

        // Count the total frames in the image
        const totalFrames = await new Promise((resolve, reject) => {
            image.identify({ bufferStream: true }, (err, data) => {
                // Try / Catch in callback to prevent hard crash
                try {
                    if (err) {
                        throw err;
                    }

                    resolve(data.Scene ? data.Scene.length : 1);
                } catch (error) {
                    reject(error);
                }
            });
        });

        // Render all frames by default
        if (!converterOptions.pageRange) {
            return range(1, totalFrames);
        }

        // Parse pageRange converter option
        let renderFrames = [];
        const ranges = converterOptions.pageRange.replace(/\s/g, '').split(',');
        ranges.forEach((r) => {
            const [start, stop] = r.split('-');

            renderFrames = renderFrames.concat(
                range(parseInt(start), parseInt(stop || start)),
            );
        });

        return renderFrames;
    }

    /**
     * Get base filename from task.
     * @param {import('../models/task').Task} task
     */
    _parseFilename(task) {
        if (task.storage.length === 1) {
            // Use storage config to set filename
            return parse(task.storage[0].parseFilename(task.outputFormat, true))
                .name;
        } else if (typeof file === 'string') {
            // Use file property to set filename
            const str = task.file.substr(task.file.lastIndexOf('/'));

            return parse(str).name;
        }

        // Default failename based on the outputFormat property
        switch (task.outputFormat) {
            case 'png':
                return 'image';
        }
    }
}

module.exports = PdfToImage;
