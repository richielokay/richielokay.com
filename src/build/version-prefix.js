'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var log = require('../logger');
var path = require('path');

/***************
 *  Functions  *
 ***************/

/**
 * Recursively moves styles and scripts in to a versioned subfolder
 * @param {type} [name] [description]
 */
function recursivePrefix(dest, scripts, styles) {
    var ext;

    for (var i in dest) {
        ext = path.extname(i);

        // Add js to prefixed folder
        if (ext === '.js') {
            scripts[i] = dest[i];
            delete dest[i];
        }

        // Add css to prefixed folder
        else if (ext === '.css') {
            styles[i] = dest[i];
            delete dest[i];
        }

        // Continue recursion
        else if (i.indexOf('_') !== 0 &&
            dest[i] === Object(dest[i]) &&
            i !== 'scripts' && i !== 'styles') {

            scripts[i] = scripts[i] || {};
            styles[i] = styles[i] || {};
            recursivePrefix(dest[i], scripts[i], styles[i]);
        }
    }
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var scripts, styles;
    var dist = context.dist;
    var version = context.version;

    if (!version) { return Promise.resolve(context); }

    // Create versioned parent paths
    scripts = dist.scripts = {};
    styles = dist.styles = {};
    scripts = scripts[version] = {};
    styles = styles[version] = {};

    return new Promise(function(resolve, reject) {
        try {
            recursivePrefix(dist, scripts, styles);
        } catch(err) {
            log('Blanca', err, 'error');
        }

        resolve(context);
    });
};
