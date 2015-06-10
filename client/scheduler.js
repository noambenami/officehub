'use strict';

/**
 * The schedule rcontains the core business logic that processes a
 * event: It figures out what the piece of content that should
 * be shown next based on the data in the event.
 *
 * A event configuration looks like this. Note that the default event
 * does not have nor need a start/end time.
 * {
 *  default: {
 *    items: [
 *      { url: foo, seconds: 30 seconds },
 *      { markdown: bar, seconds: 60 seconds, transition: fade }
 *      { html: meh, seconds: 10 minutes, transition: bounce }
 *    ]
 *  }
 *  events: [
 *  {
 *    name: "lunch announcements"
 *    start: 11.30
 *    end:  13
 *    items: [
 *      { url: foo, seconds: 30 seconds },
 *      { markdown: bar, seconds: 60 seconds, transition: fade }
 *      { html: meh, seconds: 10 minutes, transition: bounce }
 *    ]
 *  },
 *  ...
 *  ]
 * }
 * The policy is as follows:
 * 1. Look for a event that matches the current time. If no event is found, use the default.
 * 2. Show the first item.
 * 3. On timeout, increment current item duration and switch to next item if it expires.
 *      Expiration is the first of item duration ending or event end time arriving.
 * 4. When out of items in the current event, move to next event or back to default.
 */

module.exports =
  function createSchedule(config) {
    var self  = this;
    var _     = require('lodash');
    init(config);

    self = {

      /**
       * @param {Date} [date] Date for which to get the display to show,
       * will be set to the current time if not provided.
       * @returns {Object} Get the display to show right now based on the
       * event definition
       */
      getDisplay: function (date) {
        date = date || new Date();
        var event = self.getEvent(date);

        // Now, figure out which item to display now by "fast-forwarding"
        // from the start time of the event. Note that this scheduler
        // is completely stateless by design: We do not keep a current
        // item but always calculate the correct one.
        var time        = date.getTime();
        var startTime   = getStartTime(date, event);
        var ellapsedMs  = (time - startTime) % getEventLengthMs(event);

        return _.find(event.items, function (display) {
          // Advance a display at a time. Note that we're assuming that we'll
          // end up inside a display because getEvent should return a
          // event that we are in and because ellapsedMs has already been
          // modded against the duration of the event above.
          ellapsedMs -= display.seconds * 1000;
          if (ellapsedMs <= 0) {
            return true;
          }
        });
      },

      /**
       * Get the event at the given time. If no event is defined
       * for the given time, will return the default event.
       *
       * Now, note that events can be nested, so we can event stuff
       * from 12-5, as well as stuff from 1-2 and stuff from 1:30-1.45.
       * So the correct event is the latest one of any that matches.
       * E.g. at 1.31, the 1.30 event should match.
       *
       * @param {()|Date|(Number, Number)} arguments
       * 0 arguments means get current event
       * 1 argument is a date
       * 2 arguments are the hour and minute
       *
       */
      getEvent: function () {
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

        config.events.forEach(function (event) {
          // "Normalize" the hour/minute values for quick comparison
          var start = event.start.hours + event.start.minutes / 60.0;
          var end   = event.end.hours + event.end.minutes / 60.0;

          // End time non-inclusive.
          if (time >= start && time < end) {
            if (!current) {
              current = event;
            } else {
              // Get the last of the matching events by converting
              // the start time to a decimal, e.g. 13.50 for 1.30pm.
              var oldStart = current.start.hours + current.start.minutes / 60.0;
              if (start > oldStart) {
                current = event;
              }
            }
          }
        });

        return current || config.default;
      }
    };

    return self;

    /**
     * @returns {number} Javascript ms time value for the event start
     * time on the passed-in date;
     */
    function getStartTime(date, event) {
      // The default event does not have a pre-defined start time since
      // it could start/stop based on space available within non-contiguous
      // events. So, given a time, we need to go backwards until we find
      // a event and return that event's end time as the start time

      // Note that we do not cache any values to enable events to be
      // easily mutable and to avoid side effects. This enables clients
      // to be restarted and remain in sync with all other clients.
      var eventStart = event.start;
      if (!eventStart) {
        if (config.events && config.events.length) {
          // Get the event with the latest display end time:
          var lastDisplay = _.reduce(config.events, function (latestEvent, event) {
            var l = latestEvent.start;
            var s = event.start;
            if (s.hours > l.hours && s.minutes > l.minutes) {
              return event;
            }
            return latestEvent;
          }, config.events[0]);

          eventStart = lastDisplay.end;
        }
      }

      // Do not modify the passed-in date, so clone it instead
      var startDate = new Date(date.getTime());
      startDate.setHours(eventStart.hours);
      startDate.setMinutes(eventStart.minutes);

      // If the start time of the default event is computed to be in the future,
      // then we just use midnight as the start time:
      if (date.getTime() < startDate.getTime()) {
        startDate.setHours(0);
        startDate.setMinutes(0);
      }

      // All events always start at 0 seconds
      startDate.setSeconds(0);

      return startDate.getTime();
    }

    // Private utility functions

    /**
     * A preprocessing step to convert the start/end shortcuts
     * to start/end minute/hour properties:
     */
    function init(config) {
      config.events.forEach(function (event) {
        if (!event.start) {
          throw new Error('Event contains no start time');
        }
        if (!event.end) {
          throw new Error('Event contains no end time');
        }
        var start = event.start.toString().split('.');
        var end   = event.end.toString().split('.');
        event.start = {
          hours: +(start[0]),
          minutes: +(start[1]) || 0
        };
        event.end = {
          hours: +(end[0]),
          minutes: +(end[1]) || 0
        };
      });
    }

    /**
     * @returns {number} Duration of the event in milliseconds
     */
    function getEventLengthMs(event) {
      return _.sum(event.items, function (display) {
        return display.seconds * 1000;
      });
    }
  };
