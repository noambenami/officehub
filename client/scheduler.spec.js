'use strict';

require('chai').should();

describe('Schedule', function () {
  // Test schedule. Contains two default time spans,
  // as well as both partly overlapping and contained
  // schedules.
  var config = {
    default: {
      name: 'default',
      displays: [
        { duration: 10, url: 'a'},
        { duration: 20, url: 'b'},
        { duration: 50, url: 'c'}
      ]
    },
    schedules: [
      {
        name: 'Mid-day',
        start: 11,
        end: 14,
        displays: [
          { duration: 10, url: 'd'},
          { duration: 20, url: 'e'},
          { duration: 50, url: 'f'}
        ]
      },
      {
        name: 'Lunch announcements',
        start: '11.30',
        end: '12.30',
        displays: [
          { duration: 10, url: 'g'},
          { duration: 20, url: 'h'},
          { duration: 50, url: 'i'}
        ]
      },
      {
        name: 'Connect schedule and announcements',
        start: '13.30',
        end: 16,
        displays: [
          { duration: 10, url: 'g'},
          { duration: 20, url: 'h'},
          { duration: 50, url: 'i'}
        ]
      }
    ]
  };

  var scheduler = require('./scheduler')(config);

  describe('#getSchedule()', function () {
    it('gets the default schedule if no other schedule matches', function () {
      // The default schedule should be shown between 12.30 and 1.30
      // and before 11 and after 16:
      var schedule = scheduler.getSchedule(10, 0);
      schedule.name.should.be.equal('default');

      schedule = scheduler.getSchedule(16, 0);
      schedule.name.should.be.equal('default');
    });

    it('gets a specific schedule if only one matches', function () {
      var schedule = scheduler.getSchedule(11, 0);
      schedule.name.should.be.equal('Mid-day');

      schedule = scheduler.getSchedule(12, 45);
      schedule.name.should.be.equal('Mid-day');
    });

    it('gets the latest specific schedule if more than one matches', function () {
      var schedule = scheduler.getSchedule(12, 25);
      schedule.name.should.be.equal('Lunch announcements');

      schedule = scheduler.getSchedule(14, 0);
      schedule.name.should.be.equal('Connect schedule and announcements');
    });

    it.only('properly handles time boundary conditions', function () {
      var schedule = scheduler.getSchedule(13, 30);
      schedule.name.should.be.equal('Connect schedule and announcements');

      schedule = scheduler.getSchedule(15, 59);
      schedule.name.should.be.equal('Connect schedule and announcements');

      schedule = scheduler.getSchedule(16, 0);
      schedule.name.should.be.equal('default');
    });
  });

  describe('#getDisplay()', function () {
    it('shows the first display at the beginning of a schedule', function () {
      var date = new Date('1-1-1T10:00');
      console.log(date);
      var display = getDisplay();
      display.should.be.ok;
    });

    it('shows the next display when the first expires', function () {

    });

    it('shows the last display correctly', function () {

    });

    it('wraps around to the first display after the last display', function () {

    });

  })
});