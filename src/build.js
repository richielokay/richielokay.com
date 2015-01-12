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
 * Populates a site object with the path to each HTML file. Traverses
 * the tree recursively, providing a flattened path to each site.
 * @param {Object} site A site object
 * @param {Object} files An object containing all files
 * @param {Array} path The path to the current location in the tree
 */
function populateSite(site, files, sitePath) {
    sitePath = sitePath || [];

    for (var file in files) {

        // Fill in index.html
        if (file === 'index.hbs') {
            sitePath.push('index.html');
            site[sitePath.join('/')] = [];
            sitePath.pop();
        }

        // Recursively continue populating
        else if (files[file] === Object(files[file])) {
            sitePath.push(file);
            populateSite(site, files[file], sitePath);
        }
    }

    sitePath.pop();
}

/**************
 *  Settings  *
 **************/

module.exports = function build(src, dest) {
    var t0 = Date.now();
    var site = {}; 

    // Read the entire src tree
    readDirFiles.read(src, 'utf8', function(err, files) {

        // Populate the site object
        populateSite(site, files.site);

        // Add partials
        registerPartials(files.partials);

        // Register module helper
        moduleHelper(moduleName, moduleList, files);

        // // Compile templates
        

        // files.forEach(function(file) {
        //     if (path.basename(file) === 'index.hbs') {
        //         var template = handlebars.compile
        //     }
        // });
    });
};
