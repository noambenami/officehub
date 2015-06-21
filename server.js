'use strict';

/**
 * Launch the server.
 */
var express = require('express');
var app     = express();
var router  = express.Router();
var content = express.static('content');

app.use('/', content);

var scheduleController = require('./server/scheduleController');
router.get('/schedule/:office', scheduleController.get);

app.listen(80);

// Export the app to enable wrapping by grunt-express
module.exports = app;
