/**
 * The scheduler contains the core business logic that processes a
 * schedule: It figures out what the piece of content that should
 * be shown next based on the data in the schedule.
 *
 * A schedule configuration looks like this:
 * {
 *  default: {
      start: { hours: 11, minutes: 30 }
 *    end:  { hours: 13, minutes: 0 }
 *    displays: [
 *      { url: foo, duration: 30 seconds },
 *      { markdown: bar, duration: 60 seconds, transition: fade }
 *      { html: meh, duration: 10 minutes, transition: bounce }
 *    ]
 *  }
 *  schedules: [
 *  {
 *    name: "lunch announcements"
 *    start: { hours: 11, minutes: 30 }
 *    end:  { hours: 13, minutes: 0 }
 *    displays: [
 *      { url: foo, duration: 30 seconds },
 *      { markdown: bar, duration: 60 seconds, transition: fade }
 *      { html: meh, duration: 10 minutes, transition: bounce }
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

    return {

      /**
       * @returns {Object} Get the display to show right now based on the
       * schedule definition
       */
      getDisplay: function (date) {
        var schedule = this.getSchedule(date);

        // Now, figure out which item to display now by "fast-forwarding"
        // from the start time of the schedule. Note that this scheduler
        // is completely stateless by design: We do not keep a current
        // item but always calculate the correct one.
        var time = date.getTime();
        var startTime = getStartTime(date, schedule);
        var i = 0;
        while (time < startTime) {
          // Fast forward by the duration of the display
          time += schedule.displays[i].duration * 1000;
          i = (i++) % schedule.displays.length;
        }
        return schedule.displays[i];
      },

      /**
       * Get the schedule at the given time. If no schedule is defined
       * for the given time, will return the default schedule.
       */
      getSchedule: function (date) {
        var hour   = date.getHours();   // 0 - 23
        var minute = date.getMinutes(); // 0 - 59

        var schedule = _.find(config.schedules, function(schedule) {
          return schedule.start.hours <= hour
          && schedule.start.minutes <= minute
          && schedule.end.hours >= hour
          && schedule.end.minutes > minute; // End minutes non-inclusive.
        });

        return schedule || config.default;
      }

    };

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
        scheduleStart = { hours: 0, minutes: 0 };
        if (config.schedules && config.schedules.length) {
          // Get the schedule with the latest display end time:
          var lastDisplay = _.reduce(config.schedules, function(result, schedule) {
            var r = result.start;
            var s = schedule.start;
            if (s.hours > r.hours && s.minutes > r.minutes) {
              return s;
            }
            return r;
          }, config.schedules[0]);

          scheduleStart = lastDisplay.end;
        }
      }

      // Do not modify the passed-in date, so clone it instead
      var startDate = new Date(date.getTime());
      startDate.setHours(scheduleStart.hours);
      startDate.setMinutes(scheduleStart.minutes);
      return startDate.getTime();
    }

  };