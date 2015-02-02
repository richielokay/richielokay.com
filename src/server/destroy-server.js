'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var log = require('../logger');

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var server = context.server;

    return new Promise(function(resolve, reject) {
        if (!server) { resolve(context); }

        try {
            server.close(function() {
                resolve(context);
                log('Server', 'Closed');
            });
        } catch(err) {
            reject(new Error(err));
        }
    });
};
