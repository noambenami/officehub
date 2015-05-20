'use strict';

/**
 * Launch the server.
 */

var express = require('express');
var app     = express();
var router  = express.Router();
var scheduleController = require('./server/scheduleController');

router.get('/schedule', scheduleController.get);
router.post('/schedule', scheduleController.post);

app.listen(80);
