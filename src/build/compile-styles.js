'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var sass = require('node-sass');
var path = require('path');
var log = require('../logger');
var bourbon = require('node-bourbon');
var neat = require('node-neat');

/***************
 *  Functions  *
 ***************/

/**
 *
 * @param {type} [name] [description]
 */
function appendModuleImports(style, modPath, modules) {
    var thisPath, name;

    style += '\n';

    for (var i in modules) {
        name =
        thisPath = path.join(modPath, i, 'main.scss');

        if (modules[i].sass) {
            style += '@import "' + thisPath + '";\n';
        }
    }

    return style;
}

/**
 *
 * @param {type} [name] [description]
 */
function recursiveCompileSass(context, src, dest, promises, crumbs) {
    var srcPath, destPath, normalizePath, filename;
    var settings = context.settings;
    var styleSettings = settings.styles;
    var sassSheet = src['main.scss'] || '';
    var modules = dest._page._modules;
    var modPath = path.join(process.cwd(), settings.src, 'modules');
    var cwd = process.cwd();
    var debug = styleSettings.debug;
    var includePaths = bourbon.includePaths.concat(neat.includePaths.concat(styleSettings.includePaths || []));

    crumbs = crumbs || [];

    // Determine filename
    filename = 'main.css';

    // Add normalize
    normalizePath = path.join(__dirname, '../../node_modules/normalize.scss');
    includePaths.push(normalizePath);

    // Append modules
    if (modules) {
        sassSheet = appendModuleImports(sassSheet, modPath, modules);
    }

    // Determine the src and dest path
    srcPath = path.join(cwd,
        settings.src,
        'site',
        crumbs.join(path.sep),
        'main.scss');
    destPath = path.join(cwd,
        settings.dest,
        crumbs.join(path.sep),
        filename);

    // Asynchronously render CSS
    promises.push(new Promise(function(resolve) {
        sass.render({
            file: srcPath,
            data: sassSheet,
            outFile: destPath,
            includePaths: includePaths || [],
            outputStyle: styleSettings.outputStyle || 'nested',
            omitSourceMapUrl: !debug,
            sourceComments: debug,
            sourceMap: debug,
            success: function(result) {
                resolve();

                dest[filename] = result.css;

                // Optionally write map
                if (styleSettings.debug) {
                    dest[filename + '.map'] = JSON.stringify(result.map);
                }
            },
            error: function(error) {
                var file, msg;

                if (error.file) {
                    file = error.file.replace(process.cwd() + path.sep, '');
                    msg = '"' + error.message + '" in ' + file + ' on line ' + error.line;
                } else {
                    msg = error.message || 'Unknown error';
                }

                log('SASS', msg, 'error');
                resolve();
            }
        });
    }));

    // Continue recursion
    for (var j in src) {
        if (src[j] === Object(src[j])) {
            crumbs.push(j);
            dest[j] = dest[j] || {};
            recursiveCompileSass(context, src[j], dest[j], promises, crumbs);
            crumbs.pop(j);
        }
    }

    return Promise.all(promises);
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var start = Date.now();
    var site = context.app.site;
    var dist = context.dist;
    var promises = [];

    return new Promise(function(resolve, reject) {
        try {
            recursiveCompileSass(context, site, dist, promises)
                .then(function() {
                    var delta = (Date.now() - start) / 1000;
                    log('SASS', 'Compiled in ' + delta + 's');
                    resolve(context);
                })
                .catch(function(err) {
                    reject(err);
                });
        } catch (err) {
            reject('[compile-styles.js] ' + err);
        }
    });
};
