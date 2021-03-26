'use strict';

const express = require('express');
const router = express.Router();

const wrap = require('../lib/wrap');

const Parse = require('../controllers/parse.controller');

router.route('/parse/barcodes/').post(wrap(Parse.getBarcodeData));

module.exports = router;
