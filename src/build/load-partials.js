'use strict';

/******************
 *  Dependencies  *
 ******************/

var handlebars = require('handlebars');
var Promise = require('promise');
var path = require('path');

/****************
 *  Algorithms  *
 ****************/

/**
 * Recursively loads all partials in to handlebars with the
 * appropriate name.
 */
function recursiveLoad(partials, registerPartial, crumbs) {
    var name;

    crumbs = crumbs || [];

    for (var i in partials) {

        // Get names and register partials
        if (path.extname(i) === '.hbs') {
            name = crumbs.length ?
                [crumbs.join('/'), path.basename(i, '.hbs')].join('/') :
                path.basename(i, '.hbs');
            handlebars.registerPartial(name, partials[i]);
            continue;
        }

        // Continue recursion
        if (partials[i] === Object(partials[i])) {
            crumbs.push(i);
            recursiveLoad(partials[i], registerPartial, crumbs);
            crumbs.pop();
        }
    }

    crumbs.pop();
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var partials = context.app.partials || {};

    return new Promise(function(resolve, reject) {
        try {
            recursiveLoad(partials, handlebars.registerPartial.bind(handlebars));
            resolve(context);
        } catch (err) {
            reject(err);
        }
    });
};
