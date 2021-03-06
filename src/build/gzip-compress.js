'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var zlib = require('zlib');
var log = require('../logger');

/***************
 *  Functions  *
 ***************/

/**
 * Recursively gzips all strings in the destination tree,
 * turning them in to buffers.
 */
function recursiveGzip(settings, dest, promises) {
    var both, extension;
    promises = promises || [];

    // Adjust for expanded gzip options
    if (settings === Object(settings)) {
        both = settings.both || false;
        extension = settings.extension || false;
    }

    // Begin gzipping all files in dest
    for (var i in dest) {

        // Skip keys starting with _
        if (i.indexOf('_') === 0) { continue; }

        // Gzip strings
        if (typeof dest[i] === 'string') {
            promises.push(new Promise(function(resolve, reject) {
                zlib.gzip(dest[i], function(key, err, result) {
                    
                    // Remove original to replace with gzipped version
                    if (extension && !both) {
                        delete dest[key];
                        key += '.gz';
                    }

                    // Always add extension if including compressed & uncompressed
                    else if (both) { key += '.gz'; }

                    dest[key] = result;
                    if (err) { reject(err); }
                    else { resolve(); }
                }.bind(null, i));
            }));
        }

        // Continue recursion
        else if (dest[i] === Object(dest[i]) && !(dest[i] instanceof Buffer)) {
            recursiveGzip(settings, dest[i], promises);
        }
    }

    return Promise.all(promises);
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var start = Date.now();
    var settings = context.settings.gzip;

    if (context.settings.gzip) {
        return new Promise(function(resolve) {
            recursiveGzip(settings, context.dist).then(function() {
                var delta = (Date.now() - start) / 1000;
                log('Gzip', 'Compressed in ' + delta + 's');
                resolve(context);
            }).catch(function(err) {
                log('Gzip', err, 'error');
                resolve(context);
            });
        });
    } else {
        return Promise.resolve(context);
    }
};
