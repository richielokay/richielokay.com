'use strict';

/**
 * Recursively compiles all .hbs files in the site folder to .html files in
 * the distribution folder.
 *
 *     site/** /*.hbs --> dist/[build]/** /*.html
 *
 * 
 */

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
function recursiveTemplate(src, dest, compile) {
    var template;
    var content = src['content.json'] ? JSON.parse(src['content.json']) : {};
    var page = dest._page = dest._page || content;

    for (var i in src) {

        // Template matching files to the destination
        if (i === 'index.hbs') {
            template = compile(src[i]);
            dest['index.html'] = template(page);
            continue;
        }

        // Continue recursion
        if (src[i] === Object(src[i])) {
            dest[i] = {};
            recursiveTemplate(src[i], dest[i], compile);
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
            recursiveTemplate(site, dist, handlebars.compile.bind(handlebars));
            resolve(context);
        } catch (err) {
            reject('[template-site-html.js] ' + err);
        }
    });
};
