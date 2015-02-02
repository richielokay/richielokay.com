'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var assert = require('assert');

/*************
 *  Exports  *
 *************/

module.exports = function(window) {
    assert.ok(true);

    return Promise.resolve(window);
};
