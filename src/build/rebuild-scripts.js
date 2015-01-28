'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('Promise');
var uglify = require('uglify-js');
var log = require('../logger');

/****************
 *  Algorithms  *
 ****************/

/**
 * Recursively rebuilds all available watchers
 */
function recursiveBuild(context, dest, promises, crumbs) {
    var settings = context.settings;

    promises = promises || [];
    crumbs = crumbs || [];

    if (dest._bundle) {
        promises.push(new Promise(function(resolve, reject) {
            dest._bundle.bundle(function(err, buffer) {
                var content;

                if (err) {
                    reject('[compile-scripts.js] ' + err);
                } else {
                    content = buffer.toString();

                    // Uglify the script
                    if (settings.scripts.uglify) {
                        content = uglify.minify(content, {fromString: true});
                        content = content.code;
                    }

                    dest['index.js'] = content;

                    resolve();
                }
            });  
        }));
    }

    // Continue recursion
    for (var i in dest) {
        if (dest[i] === Object(dest[i])) {
            recursiveBuild(context, dest[i], promises);
        }
    }

    return Promise.all(promises);
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var start = Date.now();

    return new Promise(function(resolve) {
        recursiveBuild(context, context.dist)
            .then(function() {
                var delta = (Date.now() - start) / 1000;
                log('Browserify', 'Bundled in ' + delta + 's');
                resolve(context);
            })
            .catch(function(err) {
                log('Browserify', err, 'error');
                resolve(context);
            });
    });
};
