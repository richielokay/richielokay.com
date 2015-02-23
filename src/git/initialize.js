'use strict';

/******************
 *  Dependencies  *
 ******************/

var exec = require('child_process').exec;
var Promise = require('promise');
var fs = require('fs');

/*************
 *  Exports  *
 *************/

module.exports = function() {
    var args = arguments;

    return new Promise(function(resolve, reject) {
        fs.exists('.git', function(exists) {
            if (exists) { resolve.apply(null, args); }
        });
    });
};
