'use strict';

/******************
 *  Dependencies  *
 ******************/

var path = require('path');
var staticServer = require('node-static');
var http = require('http');
var log = require('../logger');
var Promise = require('promise');

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var appServer, port;
    var settings = context.settings;
    var servePath = path.join(process.cwd(), settings.dest);

    return new Promise(function(resolve, reject) {

        try {
            // Do nothing if no server is configured
            if (!settings.server) {
                resolve(context);
                return;
            }

            // Set up the static server
            port = settings.server.port;
            appServer = new staticServer.Server(servePath, {
                gzip: settings.gzip,
                cache: 0
            });

            // Set up the http server
            context.server = http.createServer(function(request, response) {
                request.addListener('end', function() {

                    // Make sure to send source maps appropriately
                    if (path.extname(request.url) === '.map') {
                        appServer.serveFile(request.url, 200, {
                            headers: { 'type': 'application/octet-stream' }
                        }, request, response);
                    } else { appServer.serve(request, response); }
                }).resume();
            }).listen(port, function() {
                log('Server', 'Serving at http://localhost:' + port);
                resolve(context);
            });
        } catch(err) {
            reject('[static-server.js] ' + err);
        }
    });
};
