'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var browserify = require('browserify');
var Readable = require('stream').Readable;
var path = require('path');

/****************
 *  Algorithms  *
 ****************/

/**
 * Recursively compiles all index.js scripts in to the destination
 * @param {type} [name] [description]
 */
function recursiveCompile(context, src, dest, modules, promises, crumbs) {
    var stream, basedir;
    var index = src['index.js'];
    var options = {
        debug: context.settings.scripts.debug,
        cache: {},
        packageCache: {},
        fullPaths: true        
    };
    var b = browserify(options);
    var modulePath = path.join(
        process.cwd(),
        context.settings.src,
        'modules');

    function noop() {}

    promises = promises || [];
    crumbs = crumbs || [];
    basedir = crumbs.join(path.sep);

    console.log(index);

    // Add index.js if it exists
    if (index) {
        stream = new Readable();
        stream._read = noop;
        stream.push(index);
        stream.push(null);
        console.log(index.toString());
        b.add(index, {
            basedir: basedir
        });
    }

    // Add modular code
    for (var i in modules) {
        if (modules[i].script) {
            stream = new Readable();
            stream._read = noop;
            stream.push(modules[i].script);
            stream.push(null);
            b.require(stream, {
                expose: i,
                basedir: path.join(modulePath, name)
            });
        }
    }

    // Add bundle process to promises
    promises.push(new Promise(function(b, resolve, reject) {
        b.bundle(function(err, buffer) {
            if (err) {
                reject('[compile-scripts.js] ' + err);
            } else {
                dest['index.js'] = buffer.toString();
                resolve();
            }
        });
    }.bind(null, b)));

    return Promise.all(promises);
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var site = context.app.site;
    var dist = context.dist;
    var startPath = path.join(process.cwd(), context.settings.src, 'site');
    var promises = [];

    return new Promise(function(resolve, reject) {
        try {
            recursiveCompile(context, site, dist, promises, [startPath])
                .then(function() {
                    resolve(context);
                });
        } catch (err) {
            reject('[compile-scripts.js] ' + err);
        }
    });
};
