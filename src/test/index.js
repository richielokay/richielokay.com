'use strict';

/******************
 *  Dependencies  *
 ******************/

var getSettings = require('./get-settings');
var createServer = require('../server/create-server');

/*************
 *  Exports  *
 *************/

module.exports = function(name) {
    var context = { settings: getSettings(name) };

    return createServer(context);
};
