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
    var testElement = window.document.querySelector('.test2');

    assert.equal(testElement.innerHTML, 'Test!');
};
