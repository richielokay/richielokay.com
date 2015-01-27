'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var browserify = require('browserify');
var Readable = require('stream').Readable;
var path = require('path');
var uglify = require('uglify-js');
var hbsfy = require('hbsfy');
var envify = require('envify');
var debowerify = require('debowerify');
var log = require('../logger');
var bower = require('bower');

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
                file: i,
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
function recursiveCompile(context, src, dest, promises, crumbs) {
    var stream, basedir;
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
    var b = browserify(options);
    var modulePath = path.join(
        process.cwd(),
        context.settings.src,
        'modules');
    var scriptsPath = path.join(
        context.settings.src,
        'scripts');

    promises = promises || [];
    crumbs = crumbs || [];
    basedir = crumbs.join(path.sep);

    // Add transforms
    b.transform(hbsfy);
    b.transform(envify);
    b.transform(debowerify);

    // Add polyfills
    b.add(path.join(__dirname, '..', 'client', 'polyfills'));

    // Add module bootloader
    b.add(path.join(__dirname, '..', 'client', 'run-modules.js'));

    // Add index.js if it exists
    if (index) {
        stream = new Readable();
        stream._read = noop;
        stream.push(index);
        stream.push(null);
        b.add(stream, {
            basedir: basedir,
            file: path.join(basedir, 'index.js')
        });
    }

    // Add scripts files
    if (scripts) { recursiveAddScripts(scriptsPath, scripts, b); }

    // Add modular code
    for (var i in modules) {
        if (modules[i].script) {
            stream = new Readable();
            stream._read = noop;
            stream.push(modules[i].script);
            stream.push(null);
            b.require(stream, {
                expose: 'modules/' + i,
                basedir: path.join(modulePath, modules[i].name),
                file: path.join(modulePath, modules[i].name, 'index.js')
            });
        }
    }

    // Add bundle process to promises
    promises.push(new Promise(function(b, resolve, reject) {
        var now = Date.now();

        b.bundle(function(err, buffer) {
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

                // console.log(Date.now() - now);

                resolve();
            }
        });
    }.bind(null, b)));

    // Continue recursion
    for (var j in src) {
        if (src[j] === Object(src[j])) {
            crumbs.push(j);
            dest[j] = dest[j] || {};
            recursiveCompile(context, src[j], dest[j], promises, crumbs);
            crumbs.pop(j);
        }
    }

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
        recursiveCompile(context, site, dist, promises, [startPath])
            .then(function() {
                resolve(context);
            })
            .catch(function(err) {
                log('Browserify', err, 'error');
                resolve(context);
            });
    });
};
