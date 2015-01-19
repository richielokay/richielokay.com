'use strict';

/******************
 *  Dependencies  *
 ******************/

var readdir = require('recursive-readdir');
var path = require('path');
var Promise = require('promise');

/*************
 *  Methods  *
 *************/

/**
 * Creates the application object, which is a tree structure of
 * files and folders mirroring the application directory.
 * @param {Object} settings A settings object
 */
function createApp(settings) {
    var app = { settings: settings, dist: {} };
    var cwd = process.cwd();
    var src = path.join(cwd, settings.src);

    return new Promise(function(resolve, reject) {
        readdir(src, function(err, files) {
            if (err) { reject(err); }

            // Convert files to a nested object
            else {
                files.map(function(file) {
                    var here = app;

                    file = file.replace(src + path.sep, '');
                    file = file.split(path.sep);

                    // Step through each crumb in the file path
                    file.forEach(function(crumb, index, arr) {

                        // Set the leaf node to true
                        if (index === arr.length - 1) {
                            here = here[crumb] = true;
                        }

                        // Continue building out app tree
                        else { here = here[crumb] = here[crumb] || {}; }
                    });

                    return app;
                });

                resolve(app);
            }
        });
    });
}

/*************
 *  Exports  *
 *************/

module.exports = createApp;
