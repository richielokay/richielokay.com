'use strict';

/******************
 *  Dependencies  *
 ******************/

var handlebars = require('handlebars');
var Promise = require('promise');

/****************
 *  Algorithms  *
 ****************/

/**
 * Recursively templates all index.hbs files to index.html files
 * in the destination
 * @param {type} [name] [description]
 */
function recursiveTemplate(src, dest, filter, compile) {
    var template;
    var content = src['content.json'] ? JSON.parse(src['content.json']) : {};

    for (var i in src) {

        // Template matching files to the destination
        if (i === filter) {
            template = compile(src[i]);
            dest[i] = template(content);
            continue;
        }

        // Continue recursion
        if (src[i] === Object(src[i])) {
            dest[i] = {};
            recursiveTemplate(src[i], dest[i], filter, compile);
        }
    }
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var site = context.app.site;
    var dist = context.dist = context.dist || {};

    return new Promise(function(resolve, reject) {
        try {
            recursiveTemplate(site, dist, 'index.hbs', handlebars.compile.bind(handlebars));
            resolve(context)
        } catch (err) {
            reject(err);
        }
    });
};
