'use strict';

const Gm = require('gm').subClass({ imageMagick: true });

class Pdf {
    /**
     * Converts a multi-page PDF to multiple PNGs.
     * @param {import('stream').Readable} stream
     * @param {Object} options
     * @returns {Buffer[]} Array of PNG buffers
     */
    static toPNGs(stream, options) {
        options = options || {};
        options = options.PNG || options;

        const imageFile = Gm(stream).noProfile();

        for (let key in options) {
            if (Array.isArray(options[key])) {
                imageFile[key](options[key][0], options[key][1]);
            } else {
                imageFile[key](options[key]);
            }
        }

        return new Promise((resolve, reject) => {
            imageFile.identify({ bufferStream: true }, (err, results) => {
                if (err) {
                    return reject(err);
                }

                const pageCount = results.Format.length;
                const pages = [];

                for (let i = 0; i < pageCount; i++) {
                    console.log(
                        `Converting PDF page ${i + 1} of ${pageCount}.`,
                    );
                    pages.push(
                        new Promise((resolve, reject) => {
                            imageFile
                                .selectFrame(i)
                                .setFormat('PNG')
                                .toBuffer((err, results) => {
                                    if (err) {
                                        return reject(err);
                                    }

                                    return resolve(results);
                                });
                        }),
                    );
                }

                resolve(Promise.all(pages));
            });
        });
    }
}

module.exports = Pdf;
