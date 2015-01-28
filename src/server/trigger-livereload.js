'use strict';

/******************
 *  Dependencies  *
 ******************/

var log = require('../logger');
var http = require('http');

/*************
 *  Methods  *
 *************/

/**
 *  
 * @param {type} [name] [description]
 */
function triggerLivereload(port, files) {
    var req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: '/changed?files=*',
        method: 'GET'
    }, function(res) {

        // Nothing happens without a data event
        res.on('data', function() {});

        res.on('error', function(err) {
            log('LiveReload', err, 'error');
        });
    });

    req.end();
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var lrPort = context.settings.server.lrPort;

    triggerLivereload(lrPort, '*');

    return context;
};
