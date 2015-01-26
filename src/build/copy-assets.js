'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var ncp = require('ncp');
var log = require('../logger');

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var settings = context.settings;
    if (!settings.assets) { return context; }

    return new Promise(function(resolve, reject) {
        ncp(settings.assets.src, settings.assets.dest, function(err) {
            if (err) {
                log('Assets', err, 'error');
                reject();
            } else {
                resolve(context);
            }
        });
    });
};
