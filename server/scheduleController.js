'use strict';

/**
 * Implements a simple REST endpoint that provides access to the dynamically
 * generated schedules for the various offices.
 */
module.exports = function () {

  var schedules = require('./filesystemScheduleFactory');

  var self = {

    /**
     * Searches for the office specified in the request office parameter and
     * writes the response into the response body. Will return a 404 if the
     * office is not found.
     */
    get: function (req, res) {
      var office = req.params.office;

      schedules.get(office)
        .then(function (schedule) {
          if (!schedule) {
            res.sendStatus(404);
            return;
          }
          res.send(schedule);
        });
    }

  };

  return self;

};
