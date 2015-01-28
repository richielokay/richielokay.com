'use strict';

/******************
 *  Dependencies  *
 ******************/

var path = require('path');
var del = require('del');
var Promise = require('promise');

/*************
 *  Exports  *
 *************/

module.exports = function(target) {
    var folder = path.join(process.cwd(), target);

    return function(context) {
        return new Promise(function(resolve, reject) {
            del(folder, function(err) {
                if (err) { 
                    reject('[clean-folder.js] ' + err);
                }
                else { resolve(context); }
            });
        });
    };
};
