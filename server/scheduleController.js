'use strict';

module.exports = function() {
  var fs            = require('fs');
  var scheduleFile  = __dirname + '/store/schedule.json';

  var self = {

    get: function (req, res) {
      fs.readFile(scheduleFile, function (err, data) {
        var response = data || {};
        res.json(response);
      });
    },

    post: function (req, res) {
      // validate
      try {
        var schedule = JSON.parse(req.body);
        fs.writeFile(scheduleFile, JSON.stringify(schedule, null, 2), function (err) {
          if (err) {
            return res.sendStatus(500);
          }
          res.sendStatus(200);
        });
      } catch (e) {
        // Malformed request
        res.sendStatus(400);
      }
    }

  };

  return self;

};