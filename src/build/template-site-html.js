'use strict';

/**
 * Recursively compiles all .hbs files in the site folder to .html files in
 * the distribution folder.
 *
 *     site/** /*.hbs --> dist/[build]/** /*.html
 * 
 */

/******************
 *  Dependencies  *
 ******************/

var handlebars = require('handlebars');
var Promise = require('promise');
var injectLrSnippet = require('./inject-lr-snippet');
var log = require('../logger');

/***************
 *  Functions  *
 ***************/

/**
 * Recursively templates all index.hbs files to index.html files
 * in the destination
 * @param {type} [name] [description]
 */
function recursiveTemplate(context, src, dest, compile) {
    var template, html, lr, filename;
    var content = src['content.json'] ? JSON.parse(src['content.json']) : {};
    var page = dest._page = dest._page || content;
    var settings = context.settings;

    // Determine filename
    filename = 'index.html';

    // Check if livereload is used
    try { lr = settings.html.lrSnippet; }
    catch(err) { lr = null; }

    for (var i in src) {

        // Template matching files to the destination
        if (i === 'index.hbs') {
            template = compile(src[i]);
            html = template(page);
            if (lr) { html = injectLrSnippet(html); }
            dest[filename] = html;
            continue;
        }

        // Continue recursion
        if (src[i] === Object(src[i])) {
            dest[i] = dest[i] || {};
            recursiveTemplate(context, src[i], dest[i], compile);
        }
    }
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var site = context.app.site;
    var dist = context.dist = context.dist || {};
    var start = Date.now();

    return new Promise(function(resolve) {
        try {
            recursiveTemplate(context, site, dist, handlebars.compile.bind(handlebars));
            var delta = (Date.now() - start) / 1000;
            log('Handlebars', 'Built index pages in ' + delta + 's');
            resolve(context);
        } catch (err) {
            log('Handlebars', err, 'error');
            resolve(context);
        }
    });
};
