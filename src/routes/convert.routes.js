'use strict';

const express = require('express');
const router = express.Router();

const wrap = require('../lib/wrap');

const Convert = require('../controllers/convert.controller');

router.route('/convert').post(wrap(Convert.convert));

module.exports = router;
