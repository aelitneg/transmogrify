'use strict';

const Axios = require('axios');
const { Duplex } = require('stream');

const Pdf = require('./../models/pdf');
const QrCode = require('../models/qrCode');

const INPUT_TYPES = Object.freeze(['PDF', 'PNG', 'JPG', 'JPEG', 'TIFF']);

class ParseController {
    static async getBarcodeData(req, res) {
        // TODO: Add multer support here so we can take POSTED files as an option instead of only URLs

        if (!req.body.url || !req.body.inputType) {
            return res.status(400).send({ message: 'Bad Request' });
        }

        const inputType = String(req.body.inputType).toUpperCase();
        if (!INPUT_TYPES.includes(inputType)) {
            return res.status(400).send({
                message: `Unsupported inputType: ${inputType}`,
            });
        }

        const file = await Axios.get(req.body.url, {
            responseType: 'arraybuffer',
        }).then((res) => res.data);

        // We need an image for scanning for QR codes, so PDFs need to be converted
        // TODO:  This needs to be refactored so we can scan a QR while a file is being converted.  That will be faster
        //        and it will make it much easier to set a max number of files, go in reverse, etc
        if (inputType === 'PDF') {
            const files = await ParseController._getPngsFromPdf(file);

            const barcodeDatum = await files.map((file) =>
                QrCode.getCode(file),
            );

            const barcodes = [];

            barcodeDatum.forEach((barcodeData) => {
                if (barcodeData && barcodeData.data) {
                    barcodes.push(barcodeData.data);
                }
            });

            return res.send({ barcodes });
        }

        const barcodeData = await QrCode.getCode(file);

        const barcodes = [];

        if (barcodeData && barcodeData.data) {
            barcodes.push(barcodeData.data);
        }

        res.send({ barcodes });
    }

    static async _getPngsFromPdf(file) {
        const conversionStream = new Duplex();

        conversionStream.push(file);
        conversionStream.push(null);

        const pageBuffers = await Pdf.toPNGs(conversionStream);

        return pageBuffers;
    }
}

module.exports = ParseController;
