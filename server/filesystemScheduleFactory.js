'use strict';

var BPromise  = require('bluebird');
var fs        = BPromise.promisifyAll(require('fs'));
var storePath = __dirname + '/../content/offices/';

/**
 * Runs through the files in the store. Each top level folder represents a schedule for a
 * particular office. Each office folder represents a schedule, with folders named for the
 * schedule timing. Each item in each folder becomes a scheduled item. Items have a name
 * and a postfix specifying how long they are to be displayed, e.g. 'lunch-60' will be
 * shown for 60 seconds. If no time is specified, 1 minute is the default. Items are
 * sorted in ascending alphabetical order.
 *
 * @returns {Object} Schedule built from the filesystem files
 */
module.exports = function () {

  var self = {

    /**
     * @param {String} office Name of folder to look in, e.g. 'Sydney'
     * @returns {Promise} Promise for the given schedule. Will resolve with
     * null if the office is not a folder in the store
     */
    get: function (office) {
      var schedule = {
        // jscs: disable disallowQuotedKeysInObjects
        'default': null,
        // jscs: enable disallowQuotedKeysInObjects
        events: []
      };

      // For security, we list the files in the store and match up to the passed-in office
      // so that we never take user input and pass it to fs directly.
      return fs.readdirAsync(storePath)
        .then(function (files) {
          if (files.indexOf(office) === -1) {
            // Folder does not exist
            return null;
          }
          office = storePath + office;
          return fs.readdirAsync(office);
        })
        .then(function (folders) {
          // Each folder represents a scheduled items list
          var promises = folders.map(function (folder) {
            return buildEvent(office, folder);
          });
          return BPromise.all(promises);
        })
        .then(function (events) {
          // Add the events to the schedule
          events.forEach(function (event) {
            if (event.name.toLowerCase() === 'default') {
              schedule.default = event;
            } else {
              schedule.events.push(event);
            }
          });
          return schedule;
        });
    }

  };

  /**
   * @param {String} path Path to the schedule's office's folder, e.g. "..../sydney'
   * @param {String} folder Folder name, e.g. '1-2 - foo'
   * @returns {Promise} Promise for the event whose contents are in the given folder
   */
  function buildEvent(path, folder) {
    // 1 - parse the folder into a schedule start and and time
    var event;
    // Default folder has no start/end time
    if (folder === 'default') {
      event = { name: folder };
    } else {
      var components = folder.split('-');
      if (components.length < 2) {
        throw new Error('Folder "' + folder + '" is not a valid folder name. Use a start-end-name format such as "14.30-16.00-afternoon".');
      }
      event = {
        start:  components[0].trim(),
        end:    components[1].trim(),
        name:   (components[2] && components[2].trim()) || 'No Name',
        folder: folder
      };
    }

    // 2 - read all the items, sort them
    return fs.readdirAsync(path + '/' + folder)
      .then(function (files) {
        // Sort the files to allow users to control order in which content appears, e.g.
        // 'a_foo-20, b_baz-60' or whatever scheme users want to use.
        files.sort();
        event.items = files.map(function (file) {
          var components = file.split('-');
          var seconds = components[1] && +(components[1].split('.')[0]);  // parse 5 out of '5.jpg'
          return {
            url:      file,   // We will process this into a url later
            seconds:  seconds || 60
          };
        });

        return event;
      });
  }

  return self;

};
