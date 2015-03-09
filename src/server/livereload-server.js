'use strict';

/******************
 *  Dependencies  *
 ******************/

var log = require('../logger');
var tinylr = require('tiny-lr');

/*************
 *  Methods  *
 *************/

/**
 *
 * @param {type} [name] [description]
 */
function startLivereload(dest, port) {
    var server = tinylr();

    server.listen(port, function() {
        log('LiveReload', 'Listening on port ' + port);
    });
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var settings = context.settings.server;

    if (!settings) { return context; }

    if (settings.lrPort) {
        startLivereload(context.dest, settings.lrPort);
    }

    return context;
};
