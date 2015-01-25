'use strict';

/******************
 *  Dependencies  *
 ******************/

var handlebars = require('handlebars');
var Promise = require('promise');
var extend = require('extend');
var path = require('path');

/****************
 *  Algorithms  *
 ****************/

/**
 * Recursively templates all index.hbs files to index.html files
 * in the destination
 * @param {type} [name] [description]
 */
function recursiveTemplate(src, dest, compile) {
    var fileName, template, i, pageName;
    var pages = src['pages.json'] ? JSON.parse(src['pages.json']) : {};
    var defaults = src['defaults.json'] ? JSON.parse(src['defaults.json']) : {};
    var page = dest._page = dest._page || {};

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
            dest[pageName + '.html'] = template(page);
        }
    }
    
    // Continue recursion
    for (var j in src) {
        if (src[j] === Object(src[j])) {
            dest[j] = dest[j] || {};
            recursiveTemplate(src[j], dest[j], compile);
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
            reject('[template-pages-html.js] ' + err);
        }
    });
};
