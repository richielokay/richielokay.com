'use strict';

/******************
 *  Dependencies  *
 ******************/

var https = require('https');
var Promise = require('promise');

/***************
 *  Variables  *
 ***************/

var src = 'https://api.greenhouse.io/v1/boards/bounceexchange/embed/departments';

/*************
 *  Exports  *
 *************/

module.exports = new Promise(function(resolve, reject) {
    var json = '';

    https.get(src, function(res) {
        res.on('data', function(data) {
            json += data.toString();
        });

        res.on('end', function() {
            var data = JSON.parse(json);
            resolve(data);
        });

        res.on('error', function(err) {
            reject(err);
        });
    });
});
