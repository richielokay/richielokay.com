'use strict';

/******************
 *  Dependencies  *
 ******************/

var handlebars = require('handlebars');
var Promise = require('promise');
var path = require('path');

/***************
 *  Functions  *
 ***************/

/**
 * Recursively loads all partials in to handlebars with the
 * appropriate name.
 */
function loadHelpers(helpers) {
    var helper, name;
    var cwd = process.cwd();
    var base = './app/scripts/helpers';

    for (var i in helpers) {

        // Get names and register helpers
        if (path.extname(i) === '.js') {
            name = path.basename(i, '.js');
            helper = require(path.join(cwd, base, i));
            handlebars.registerHelper(name, helper);
        }
    }
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var helpers;

    try {
        helpers = context.app.scripts.helpers || {};
    } catch(err) {
        helpers = {};
    }

    return new Promise(function(resolve, reject) {
        try {
            loadHelpers(helpers);
            resolve(context);
        } catch (err) {
            reject('[load-helpers.js] ' + err);
        }
    });
};
