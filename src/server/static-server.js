'use strict';

/******************
 *  Dependencies  *
 ******************/

var path = require('path');
var staticServer = require('node-static');
var http = require('http');
var log = require('../logger');

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var appServer, port;
    var settings = context.settings;
    var servePath = path.join(process.cwd(), settings.dest);
    var gzipFilters = /(^text)|(javascript$)/;

    // Do nothing if no server is configured
    if (!settings.server) { return context; }

    port = settings.server.port;
    appServer = new staticServer.Server(servePath, {
        gzip: settings.gzip ? gzipFilters : null
    });

    // Set up the http server
    context.server = http.createServer(function(request, response) {
        request.addListener('end', function() {
            appServer.serve(request, response);
        }).resume();
    }).listen(port);

    log('Server', 'Serving at http://localhost:' + port);

    return context;
};
