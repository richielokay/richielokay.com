'use strict';

/******************
 *  Dependencies  *
 ******************/

var readDirFiles = require('read-dir-files');
var handlebars = require('handlebars');
var path = require('path');
var moduleHelper = require('./module-helper');

/***************
 *  Functions  *
 ***************/

/**
 * Recursively registers all partials in the given /partials folder
 * @param {Object} partials A list of loaded partials files
 * @param {Array} [varname] [description]
 */
function registerPartials(partials, partialPath) {
    var name;

    partialPath = partialPath || [];

    for (var item in partials) {
        
        // Register a partial
        if (path.extname(item) === '.hbs') {
            partialPath.push(path.basename(item));
            name = partialPath.join('/');
            handlebars.registerPartial(name, partials[item]);
            partialPath.pop();
        }

        // Continue traversing directory
        else if (partials[item] === Object(partials[item])) {
            partialPath.push(item);
            registerPartials(partials[item], partialPath);
        }
    }

    partialPath.pop();
}

/**
 * 
 * @param {type} [name] [description]
 */
function processSite(files, site) {
    site = site || {};

    for (var file in files) {

    }
}

/**************
 *  Settings  *
 **************/

module.exports = function build(src, dest) {
    var site;
    var t0 = Date.now();

    // Read the entire src tree
    readDirFiles.read(src, 'utf8', function(err, files) {
        console.log(Date.now() - t0);

        console.log(JSON.stringify(files));

        // Add partials
        registerPartials(files.partials);

        // Process site
        site = processSite(files.site);
    });
};
