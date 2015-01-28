'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var browserify = require('browserify');
var watchify = require('watchify');
var path = require('path');
var uglify = require('uglify-js');
var hbsfy = require('hbsfy');
var envify = require('envify');
var debowerify = require('debowerify');
var log = require('../logger');

/****************
 *  Algorithms  *
 ****************/

function noop() {}

/**
 * Recursively adds scripts to the browserify object
 */
function recursiveAddScripts(scriptsPath, scripts, b, crumbs) {
    var basedir, filePath, crumbsPath;

    crumbs = crumbs || [];
    crumbsPath = crumbs.join(path.sep);
    basedir = path.join(scriptsPath, crumbsPath);

    for (var i in scripts) {

        // Add scripts
        if (path.extname(i) === '.js') {
            filePath = path.join(scriptsPath, crumbsPath, i);
            b.require('./' + filePath, {
                basedir: basedir,
                expose: 'scripts/' +
                    (crumbs.length ? crumbs.join('/') + '/' : '') +
                    path.basename(i, '.js')
            });
        }

        // Continue recursion
        if (scripts[i] === Object(scripts[i])) {
            crumbs.push(i);
            recursiveAddScripts(scriptsPath, scripts[i], b, crumbs);
            crumbs.pop();
        }
    }
}

/**
 * Recursively compiles all index.js scripts in to the destination
 * @param {type} [name] [description]
 */
function recursiveCompile(context, src, dest, promises, callback, crumbs) {
    var stream, basedir;
    var cwd = process.cwd();
    var index = src['index.js'];
    var modules = dest._page._modules;
    var scripts = context.app.scripts;
    var settings = context.settings;
    var options = {
        debug: settings.scripts.debug,
        cache: {},
        packageCache: {},
        noParse: context.bowerPackages || [],
        fullPaths: true,
        basedir: process.cwd()
    };

    // Browserify / watchify
    var b = browserify(options);
    var w = callback ? watchify(b) : b;

    // Paths
    var modulePath = path.join(
        cwd,
        context.settings.src,
        'modules');
    var scriptsPath = path.join(
        context.settings.src,
        'scripts');

    promises = promises || [];
    crumbs = crumbs || [];
    basedir = crumbs.join(path.sep);

    // Transforms
    w.transform(hbsfy);
    w.transform(envify);
    w.transform(debowerify);

    // Add polyfills
    w.add(path.join(__dirname, '..', 'client', 'polyfills'));

    // Add module bootloader
    w.add(path.join(__dirname, '..', 'client', 'run-modules.js'));

    // Add index.js if it exists
    if (index) {
        w.add(path.join(basedir, 'index.js'), {
            basedir: basedir
        });
    }

    // Add scripts files
    // Waiting for resolution to:
    // https://github.com/substack/node-browserify/issues/1099
    // if (scripts) { recursiveAddScripts(scriptsPath, scripts, w); }

    // Add modular code
    for (var i in modules) {
        if (modules[i].script) {
            w.require(path.join(modulePath, modules[i].name, 'index.js'), {
                expose: 'modules/' + i,
                basedir: path.join(modulePath, modules[i].name)
            });
        }
    }

    // Add bundle process to promises
    promises.push(new Promise(function(w, resolve, reject) {
        function bundle() {
            w.bundle(function(err, buffer) {
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
        }

        bundle();

        // Establish watch callback
        if (callback) {
            w.on('update', callback);

            // Close existing bundle watchers
            if (dest._bundle) { dest._bundle.close(); }

            // Establish the bundle watcher
            dest._bundle = w;
        }
    }.bind(null, w)));

    // Continue recursion
    for (var j in src) {
        if (src[j] === Object(src[j])) {
            crumbs.push(j);
            dest[j] = dest[j] || {};
            recursiveCompile(context, src[j], dest[j], promises, callback, crumbs);
            crumbs.pop(j);
        }
    }

    return Promise.all(promises);
}

/*************
 *  Exports  *
 *************/

module.exports = function(callback) {
    return function(context) {
        var site = context.app.site;
        var dist = context.dist;
        var startPath = path.join(process.cwd(), context.settings.src, 'site');
        var promises = [];
        var start = Date.now();

        return new Promise(function(resolve) {
            recursiveCompile(context, site, dist, promises, callback, [startPath])
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
};
