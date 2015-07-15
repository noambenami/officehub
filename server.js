'use strict';

var scheduleController = require('./server/scheduleController');

/**
 * Launch the server.
 */
var express = require('express');
var app     = express();
var router  = express.Router();

router.get('/:office', scheduleController.get);

app.use('/content', express.static('content'));
app.use('/schedule', router);

console.log('Listening on port 3000');
app.listen(3000);

// Export the app to enable wrapping by grunt-express
module.exports = app;
