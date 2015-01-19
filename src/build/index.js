'use strict';

/*************
 *  Modules  *
 *************/

var getSettings = require('./settings');
var createApp = require('./app');
var buildHTML = require('./html');
// var scripts = require('./scripts');
// var styles = require('./styles');
// var server = require('./server');
// var lrServer = require('./lr-server');

/***********
 *  Build  *
 ***********/

module.exports = function build(name) {
    getSettings(name)
        .then(createApp)
        .then(buildHTML);
        // .then(function(app) {
        //     console.log(app);
        // });

    // var html = html(site, settings);
    // var scripts = scripts(site, settings);
    // var styles = styles(site, settings);    
};
