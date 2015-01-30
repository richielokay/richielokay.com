'use strict';

/******************
 *  Dependencies  *
 ******************/

var handlebars = require('handlebars');
var Promise = require('promise');
var extend = require('extend');
var path = require('path');
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
    var fileName, template, i, pageName, html, lr;
    var pages = src['pages.json'] ? JSON.parse(src['pages.json']) : {};
    var defaults = src['defaults.json'] ? JSON.parse(src['defaults.json']) : {};
    var page = dest._page = dest._page || {};
    var settings = context.settings;

    // Check if livereload is used
    try { lr = settings.html.lrSnippet; }
    catch(err) { lr = null; }

    for (i in pages) {

        // Adapt for whether extension is included
        fileName = path.extname(i) === '.hbs' ?
            i :
            i + '.hbs';

        // Check if template file exists
        if (!src[fileName]) {
            console.error('No template ' + fileName);
            continue;
        }

        template = compile(src[fileName]);

        // Template all pages
        for (pageName in pages[i]) {
            extend(page, defaults, pages[i][pageName]);
            html = template(page);
            if (lr) { html = injectLrSnippet(html); }
            dest[pageName + '.html'] = html;
        }
    }
    
    // Continue recursion
    for (var j in src) {
        if (src[j] === Object(src[j])) {
            dest[j] = dest[j] || {};
            recursiveTemplate(context, src[j], dest[j], compile);
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

    return new Promise(function(resolve, reject) {
        try {
            recursiveTemplate(context, site, dist, handlebars.compile.bind(handlebars));
            var delta = (Date.now() - start) / 1000;
            log('Handlebars', 'Built additional pages in ' + delta + 's');
            resolve(context);
        } catch (err) {
            log('Handlebars', err, 'error');
            reject();
        }
    });
};
