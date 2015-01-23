'use strict';

/*************
 *  Modules  *
 *************/

var getSettings = require('./get-settings');
var loadApp = require('./load-app');
var templateSiteHTML = require('./template-site-html');
var loadPartials = require('./load-partials');
var loadModules = require('./load-modules');
// var scripts = require('./scripts');
// var styles = require('./styles');
// var server = require('./server');
// var lrServer = require('./lr-server');

/***********
 *  Tasks  *
 ***********/

/***********
 *  Build  *
 ***********/

module.exports = function build(name) {
    var lrEnabled;
    var context = { settings: getSettings(name) };
    var start = Date.now();

    loadApp(context)
        .then(loadPartials)
        .then(loadModules)
        .then(templateSiteHTML)
        .then(function(context) {
<<<<<<< Updated upstream
            console.log(context);
=======
            console.log(((Date.now() - start) / 1000) + 's');
>>>>>>> Stashed changes
        })
        .catch(function(err) {
            console.error(err);
        });

    // var html = html(site, settings);
    // var scripts = scripts(site, settings);
    // var styles = styles(site, settings);    
};
