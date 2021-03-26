'use strict';

const Express = require('express');

const Status = require('../controllers/status.controller');
const wrap = require('../lib/wrap');

const router = Express.Router();

router.route('/status/').get(wrap(Status.getStatus));

module.exports = router;
