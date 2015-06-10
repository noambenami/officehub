'use strict';

require('chai').should();

describe('Scheduler', function () {
  // Test schedule. Contains two default time spans,
  // as well as both partly overlapping and contained
  // schedules.
  var config = {
    default: {
      name: 'default',
      items: [
        { seconds: 10, url: 'a'},
        { seconds: 20, url: 'b'},
        { seconds: 50, url: 'c'}
      ]
    },
    events: [
      {
        name: 'Mid-day',
        start: 11,
        end: 14,
        items: [
          { seconds: 10, url: 'd'},
          { seconds: 20, url: 'e'},
          { seconds: 50, url: 'f'}
        ]
      },
      {
        name: 'Lunch announcements',
        start: '11.30',
        end: '12.30',
        items: [
          { seconds: 10, url: 'g'},
          { seconds: 20, url: 'h'},
          { seconds: 50, url: 'i'}
        ]
      },
      {
        name: 'Connect schedule and announcements',
        start: '13.30',
        end: 16,
        items: [
          { seconds: 10, url: 'g'},
          { seconds: 20, url: 'h'},
          { seconds: 50, url: 'i'}
        ]
      },
      {
        name: 'Evening fun',
        start: 20,
        end: 22,
        items: [
          { seconds: 10, url: 'g'},
          { seconds: 20, url: 'h'},
          { seconds: 50, url: 'i'}
        ]
      }
    ]
  };

  var scheduler = require('./scheduler')(config);

  describe('#getEvent()', function () {
    it('gets the default schedule if no other schedule matches', function () {
      // The default schedule should be shown between 12.30 and 1.30
      // and before 11 and after 16:
      var event = scheduler.getEvent(10, 0);
      event.name.should.be.equal('default');

      event = scheduler.getEvent(16, 0);
      event.name.should.be.equal('default');
    });

    it('gets a specific schedule if only one matches', function () {
      var event = scheduler.getEvent(11, 0);
      event.name.should.be.equal('Mid-day');

      event = scheduler.getEvent(12, 45);
      event.name.should.be.equal('Mid-day');
    });

    it('gets the latest specific schedule if more than one matches', function () {
      var event = scheduler.getEvent(12, 25);
      event.name.should.be.equal('Lunch announcements');

      event = scheduler.getEvent(14, 0);
      event.name.should.be.equal('Connect schedule and announcements');
    });

    it('properly handles time boundary conditions', function () {
      var event = scheduler.getEvent(13, 30);
      event.name.should.be.equal('Connect schedule and announcements');

      event = scheduler.getEvent(15, 59);
      event.name.should.be.equal('Connect schedule and announcements');

      event = scheduler.getEvent(16, 0);
      event.name.should.be.equal('default');
    });

  });

  describe('#getDisplay()', function () {

    var date = new Date('January 1, 2000, 10:00');

    it('shows the first display at the beginning of the default schedule', function () {
      // Show the first display in the default schedule
      var display = scheduler.getDisplay(date);
      display.url.should.be.equal('a');
    });

    it('shows the next display when the first expires', function () {
      date.setSeconds(13);
      var display = scheduler.getDisplay(date);
      display.url.should.be.equal('b');

    });

    it('shows the last display correctly', function () {
      date.setSeconds(50);
      var display = scheduler.getDisplay(date);
      display.url.should.be.equal('c');
    });

    it('wraps around to the first display after the last display', function () {
      date.setMinutes(1);
      date.setSeconds(25);
      var display = scheduler.getDisplay(date);
      display.url.should.be.equal('a');
    });

    it('finds the correct non-default schedule display', function () {
      date = new Date('January 1, 2000, 11:00');

      var display = scheduler.getDisplay(date);
      display.url.should.be.equal('d');
    });

  });
});