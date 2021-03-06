'use strict';

/******************
 *  Dependencies  *
 ******************/

var readdir = require('read-dir-files');
var path = require('path');
var Promise = require('promise');
var log = require('../logger');

/***************
 *  Functions  *
 ***************/

/**
 * Creates the application object, which is a tree structure of
 * files and folders mirroring the application directory.
 * @param {Object} settings A settings object
 */
function loadApp(context) {
    var cwd = process.cwd();
    var src = path.join(cwd, context.settings.src);

    return new Promise(function(resolve) {

        readdir.read(src, 'utf8', function(err, files) {
            if (err) { log('Blanca', '[load-app.js] ' + err, 'error'); }

            // Convert files to a nested object
            else {
                context.app = files;
                resolve(context);
            }
        });
    });
}

/*************
 *  Exports  *
 *************/

module.exports = loadApp;
