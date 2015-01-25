'use strict';

/******************
 *  Dependencies  *
 ******************/

var fs = require('fs');
var path = require('path');
var Promise = require('Promise');

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var dest = path.join(process.cwd(), '_context.json');

    return new Promise(function(resolve, reject) {
        fs.writeFile(dest, JSON.stringify(context, null, 4), function(err) {
            if (err) {
                reject('[write-context.js] ' + err);
            }
            else { resolve(context); }
        });
    });
};
