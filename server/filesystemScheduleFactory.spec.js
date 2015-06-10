'use strict';

require('chai').should();
var factory   = require('./filesystemScheduleFactory')();
var BPromise  = require('bluebird');

describe.only('filesystemScheduleFactory', function () {

  it('should be able to read a schedule from the filesytem', function () {
    var london = factory.get('London');
    var sf     = factory.get('SF');
    var sydney = factory.get('Sydney');

    return BPromise.all([london, sf, sydney])
    .then(function (schedules) {
        var sf = schedules[1];
        sf.default.should.be.ok;
        sf.default.name.should.be.equal('default');
        sf.default.items.length.should.be.equal(1);
        sf.default.items[0].url.should.be.equal('img5.jpg');
        sf.events.should.be.ok;
        sf.events.length.should.be.equal(3);
        var e1 = sf.events[0];
        e1.start.should.be.equal('1');
        e1.end.should.be.equal('2');
        e1.name.should.be.equal('foo');
        var e2 = sf.events[1];
        e2.start.should.be.equal('17');
        e2.end.should.be.equal('21.15');
        e2.name.should.be.equal('bar');
        e2.items.length.should.be.equal(2);
        e2.items[0].url.should.be.equal('img2.jpg');
        e2.items[1].url.should.be.equal('img3.jpg');
        console.log(JSON.stringify(schedules, null, 2));
      });
  });

});