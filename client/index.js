'use strict';

var $ = require('../node_modules/jquery');
require('../node_modules/jquery-ui');
var scheduler = require('./scheduler');

$(function () {

  var office;
  var schedule      = null;
  var visibleImage  = 1;
  var currentItem   = null;

  // Run two threads:
  // - 1 refreshes the scheduler once per second (because hey, why not.)
  setInterval(getSchedule, 1000);
  // - 2 updates the currently displayed resource
  setInterval(showNext, 1000);

  function getSchedule() {
    office = window.location.hash || 'SF';
    if (office[0] === '#') {
      office = office.substr(1);
    }
    $.ajax('/schedule/' + office)
      .done(function (data) {
        if (data) {
          schedule = scheduler(data);
        }
      })
      .fail(function () {
        schedule = null;
        console.error('No schedule found for office "' + office + '"!');
      });
  }

  function showNext() {
    if (!schedule) {
      return;
    }
    var currentEvent = schedule.getEvent();
    var nextItem     = schedule.getDisplay();
    if (!currentEvent || !nextItem) {
      // Should never happen, but let's be safe
      return;
    }

    if (JSON.stringify(nextItem) === JSON.stringify(currentItem)) {
      // No change
      return;
    }
    currentItem = nextItem;

    var effect    = 'scale';
    var options   = { effect: 'isInOutQuint'};

    // Load the new image into the non-visible image, then fade out the visible image:
    var invisibleImage = visibleImage === 1 ? 2 : 1;
    $('#image' + invisibleImage).one('load', function () {
      $('#image' + visibleImage).hide(effect, options, 1222);
      $('#image' + invisibleImage).show(effect, options, 1222);
      visibleImage = invisibleImage;
    })
      .attr('src', '/content/offices/' + office + '/' + currentEvent.folder + '/' + currentItem.url);

  }

});
