'use strict';

require('chai').should();

describe('Schedule', function () {

  // Test schedule. Contains two default time spans,
  // as well as both partly overlapping and contained
  // schedules.
  var config = {
    default: {
      name: "Default",
      displays: [
        { duration: 10, url: "a"},
        { duration: 20, url: "b"},
        { duration: 50, url: "c"}
      ]
    },
    schedules: [
      {
        name: "Mid-day",
        start: 11,
        end: 14,
        displays: [
          { duration: 10, url: "d"},
          { duration: 20, url: "e"},
          { duration: 50, url: "f"}
        ]
      },
      {
        name: "Lunch announcements",
        start: 11.30,
        end: 12.30,
        displays: [
          { duration: 10, url: "g"},
          { duration: 20, url: "h"},
          { duration: 50, url: "i"}
        ]
      },
      {
        name: "Connect schedule and announcements",
        start: 1.30,
        end: 16,
        displays: [
          { duration: 10, url: "g"},
          { duration: 20, url: "h"},
          { duration: 50, url: "i"}
        ]
      }
    ]
  };

  var scheduler = require('./scheduler')(config);

  describe('#getSchedule()', function () {

    it('gets the default schedule if no other schedule matches', function () {
      // The default schedule should be shown between 12.30 and 1.30
      // and before 11 and after 16:
      scheduler.getSchedule(10, 0);
    });

    it('gets a specific schedule if only one matches', function () {

    });

    it('gets the latest specific schedule if more than one matches', function () {

    });

  });
});