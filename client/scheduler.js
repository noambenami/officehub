'use strict';

/**
 * The scheduler contains the core business logic that processes a
 * schedule: It figures out what the piece of content that should
 * be shown next based on the data in the schedule.
 *
 * A schedule configuration looks like this. Note that the default schedule
 * does not have nor need a start/end time.
 * {
 *  default: {
 *    displays: [
 *      { url: foo, seconds: 30 seconds },
 *      { markdown: bar, seconds: 60 seconds, transition: fade }
 *      { html: meh, seconds: 10 minutes, transition: bounce }
 *    ]
 *  }
 *  schedules: [
 *  {
 *    name: "lunch announcements"
 *    start: 11.30
 *    end:  13
 *    displays: [
 *      { url: foo, seconds: 30 seconds },
 *      { markdown: bar, seconds: 60 seconds, transition: fade }
 *      { html: meh, seconds: 10 minutes, transition: bounce }
 *    ]
 *  },
 *  ...
 *  ]
 * }
 * The policy is as follows:
 * 1. Look for a schedule that matches the current time. If no schedule is found, use the default.
 * 2. Show the first item.
 * 3. On timeout, increment current item duration and switch to next item if it expires.
 *      Expiration is the first of item duration ending or schedule end time arriving.
 * 4. When out of items in the current schedule, move to next schedule or back to default.
 */

module.exports =
  function createScheduler(config) {
    var self  = this;
    var _     = require('lodash');
    init(config);

    self = {

      /**
       * @param {Date} [date] Date for which to get the display to show,
       * will be set to the current time if not provided.
       * @returns {Object} Get the display to show right now based on the
       * schedule definition
       */
      getDisplay: function (date) {
        date = date || new Date();
        var schedule = self.getSchedule(date);

        // Now, figure out which item to display now by "fast-forwarding"
        // from the start time of the schedule. Note that this scheduler
        // is completely stateless by design: We do not keep a current
        // item but always calculate the correct one.
        var time        = date.getTime();
        var startTime   = getStartTime(date, schedule);
        var ellapsedMs  = (time - startTime) % getScheduleLengthMs(schedule);
        console.log('e:', time - startTime, 'slm:', getScheduleLengthMs(schedule));
        return _.find(schedule.displays, function (display) {
          // Advance a display at a time. Note that we're assuming that we'll
          // end up inside a display because getSchedule should return a
          // schedule that we are in and because ellapsedMs has already been
          // modded against the duration of the schedule above.
          ellapsedMs -= display.seconds * 1000;
          if (ellapsedMs <= 0) {
            return true;
          }
        });
      },

      /**
       * Get the schedule at the given time. If no schedule is defined
       * for the given time, will return the default schedule.
       *
       * Now, note that schedules can be nested, so we can schedule stuff
       * from 12-5, as well as stuff from 1-2 and stuff from 1:30-1.45.
       * So the correct schedule is the latest one of any that matches.
       * E.g. at 1.31, the 1.30 schedule should match.
       *
       * @param {()|Date|(Number, Number)} arguments
       * 0 arguments means get current schedule
       * 1 argument is a date
       * 2 arguments are the hour and minute
       *
       */
      getSchedule: function () {
        var hour;
        var minute;
        if (arguments.length < 2) {
          var date = arguments[0] || new Date();
          hour   = date.getHours();
          minute = date.getHours();
        } else {
          hour = arguments[0];    // 0 - 23
          minute = arguments[1];  // 0 - 59
        }

        var time    = hour + minute / 60.0;
        var current = null;

        config.schedules.forEach(function (schedule) {
          // "Normalize" the hour/minute values for quick comparison
          var start = schedule.start.hours + schedule.start.minutes / 60.0;
          var end   = schedule.end.hours + schedule.end.minutes / 60.0;

          // End time non-inclusive.
          if (time >= start && time < end) {
            if (!current) {
              current = schedule;
            } else {
              // Get the last of the matching schedules by converting
              // the start time to a decimal, e.g. 13.50 for 1.30pm.
              var oldStart = current.start.hours + current.start.minutes / 60.0;
              if (start > oldStart) {
                current = schedule;
              }
            }
          }
        });

        return current || config.default;
      }
    };

    return self;

    /**
     * @returns {number} Javascript ms time value for the schedule start
     * time on the passed-in date;
     */
    function getStartTime(date, schedule) {
      // Here is the tricksy bit: The default schedule has no start time,
      // so if there are scheduled items, we use the end time of the last
      // one. If there are no scheduled items, we just use the beginning
      // of the day. This way, we get a consistent display item for the
      // default schedule.
      //
      // Note that we do not cache any values to enable schedules to be
      // easily mutable and to avoid side effects.
      var scheduleStart = schedule.start;
      if (!scheduleStart) {
        // Default to midnight:
        scheduleStart = {
          hours: 0,
          minutes: 0
        };
        if (config.schedules && config.schedules.length) {
          // Get the schedule with the latest display end time:
          var lastDisplay = _.reduce(config.schedules, function (result, schedule) {
            var r = result.start;
            var s = schedule.start;
            if (s.hours > r.hours && s.minutes > r.minutes) {
              return schedule;
            }
            return result;
          }, config.schedules[0]);

          scheduleStart = lastDisplay.end;
        }
      }

      // Do not modify the passed-in date, so clone it instead
      var startDate = new Date(date.getTime());
      FIX THIS METHOD?
      console.log(schedule.name, 'starts at', scheduleStart.hours, ':', scheduleStart.minutes);
      startDate.setHours(scheduleStart.hours);
      startDate.setMinutes(scheduleStart.minutes);
      return startDate.getTime();
    }

    // Private utility functions

    /**
     * A preprocessing step to convert the start/end shortcuts
     * to start/end minute/hour properties:
     */
    function init(config) {
      config.schedules.forEach(function (schedule) {
        if (!schedule.start) {
          throw new Error('Schedule contains no start time');
        }
        if (!schedule.end) {
          throw new Error('Schedule contains no end time');
        }
        var start = schedule.start.toString().split('.');
        var end   = schedule.end.toString().split('.');
        schedule.start = {
          hours: +(start[0]),
          minutes: +(start[1]) || 0
        };
        schedule.end = {
          hours: +(end[0]),
          minutes: +(end[1]) || 0
        };
      });
    }

    /**
     * @returns {number} Duration of the schedule in milliseconds
     */
    function getScheduleLengthMs(schedule) {
      return _.sum(schedule.displays, function (display) {
        return display.seconds * 1000;
      });
    }
  };
