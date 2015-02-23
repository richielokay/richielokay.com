'use strict';

/******************
 *  Dependencies  *
 ******************/

var exec = require('child_process').exec;
var Promise = require('promise');
var log = require('../logger');

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    if (context.settings.versioning) {
        return new Promise(function(resolve) {
            exec('git rev-parse --short HEAD', function(err, stdout) {
                var version = stdout.trim();

                if (err) {
                    log('Git', err, 'error');
                    resolve(context);
                    return;
                }

                context.version = version;

                resolve(context);

                log('Git', 'Version ' + version);
            });
        });
    }

    else { return Promise.resolve(context); }
};
