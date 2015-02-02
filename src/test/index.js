'use strict';

/******************
 *  Dependencies  *
 ******************/

var getSettings = require('../get-settings');
var staticServe = require('../server/static-server');
var path = require('path');
var Promise = require('promise');
var log = require('../logger');

/*************
 *  Exports  *
 *************/

module.exports = function(name, file) {
    var runner;
    var cwd = process.cwd();
    var context = { settings: getSettings(name) };
    var serverInfo = context.settings.server =
        context.settings.server ||
        { port: 8231 };

    // Set BASE_URL environment variable
    process.env.BASE_URL = 'http://localhost:' + serverInfo.port;

    // Get runner path
    runner = file ?
        path.join(cwd, 'tests', file) :
        path.join(cwd, 'tests');

    // Resolve test runner
    runner = require(runner);

    // Run all tasks and catch errors
    staticServe(context)
        .then(runner)
        .then(function() {
            log('Test', 'Tests Passed');
            process.exit(0);
        })
        .catch(function(err) {
            log('Test', err.toString(), 'error');
            process.exit(1);
        });
};
