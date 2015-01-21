'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var browserify = require('browserify');

/****************
 *  Algorithms  *
 ****************/

/**
 * Recursively compiles all index.js scripts in to the destination
 * @param {type} [name] [description]
 */
function recursiveCompile(src, dest, compile) {
    var template;
    var content = src['content.json'] ? JSON.parse(src['content.json']) : {};
    var page = dest._page = dest._page || content;

    for (var i in src) {

        // Template matching files to the destination
        if (i === filter) {
            template = compile(src[i]);
            dest[i] = template(page);
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
    var site = context.dist;

    return new Promise(function(resolve, reject) {
        try {
            recursiveCompile(site);
            resolve(context);
        } catch (err) {
            reject(err);
        }
    });
};
