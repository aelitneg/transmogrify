'use strict';

const { createReadStream, createWriteStream } = require('fs');
const { Readable } = require('stream');
const Gs = require('ghostscript4js');
const Tmp = require('tmp');

Tmp.setGracefulCleanup();

class PdfRepair {
    /**
     * Use GhostScript to repair a malformed PDF.
     * @param {import('stream').PassThrough} pdfStream
     */
    static run(pdfStream) {
        let writeFile; //Reference to file created from source pdfStream
        let readFile; // Reference to repaired file

        return Promise.all([
            // Create temporary files as ghostscript4js doesn't support streams / buffers
            PdfRepair._createTempFile(),
            PdfRepair._createTempFile(),
        ])
            .then((results) => {
                writeFile = results[0];
                readFile = results[1];

                // Write PDF to temporary file
                return new Promise((resolve) => {
                    const writeStream = createWriteStream(writeFile.path);

                    PdfRepair._registerListeners(writeStream, writeFile);
                    writeStream.on('finish', resolve());

                    pdfStream.pipe(writeStream);
                });
            })
            .then(() => {
                // Run GhostScript to repair pdf using temporary files
                return Gs.execute(
                    `-sDEVICE=pdfwrite -o ${readFile.path} -sDEVICE=pdfwrite ${writeFile.path}`,
                );
            })
            .then(() => {
                // Stream repaired PDF from temporary file and cleanup
                const readStream = createReadStream(readFile.path);

                PdfRepair._registerListeners(readStream, readFile);

                writeFile.cleanup();

                return readStream;
            })
            .catch((error) => {
                // Cleanup temporary files and re-throw error
                writeFile.cleanup();
                readFile.cleanup();

                throw error;
            });
    }

    /**
     * Async wrapper around tmp.file.
     */
    static _createTempFile() {
        return new Promise((resolve, reject) => {
            Tmp.file((err, path, fd, cleanup) => {
                if (err) {
                    reject(err);
                }

                resolve({
                    path,
                    cleanup,
                });
            });
        });
    }

    /**
     * Register stream event listeners
     * @param {import('stream').Writable} stream
     * @param {import('fs')} file
     */
    static _registerListeners(stream, file) {
        stream.once('error', () => file.cleanup && file.cleanup());

        stream.once('close', () => file.cleanup && file.cleanup());

        if (stream instanceof Readable) {
            stream.on('end', () => file.cleanup && file.cleanup());
        }
    }
}

module.exports = PdfRepair;
