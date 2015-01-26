'use strict';

/******************
 *  Dependencies  *
 ******************/

var chokidar = require('chokidar');
var log = require('../logger');

/*************
 *  Methods  *
 *************/

/**
 * 
 * @param {type} [name] [description]
 */
function createWatch(watchPath, callback) {
    var shortPath, ready;
    var watcher = chokidar.watch(watchPath, { persistent: true, ignore: /\.js$/ });

    // Set up watch on source files
    watcher.on('all', function(evt, filePath) {
        if (ready) {
            shortPath = filePath.replace(process.cwd() + '/', '');
            log('Watch', evt.toUpperCase() + ': ' + shortPath);
            callback(filePath, evt);
        }
    });

    watcher.on('ready', function() {
        log('Watch', 'Watching ' + watchPath.replace(process.cwd() + '/', ''));
        ready = true;
    });
}

/*************
 *  Exports  *
 *************/

module.exports = function(callback) {
    return function(context) {
        var settings = context.settings;

        if (settings.server && settings.server.lrPort) {
            try { createWatch(settings.src, callback); }
            catch (err) {
                log('Watch', err, 'error');
            }
        }

        return context;
    };
};
