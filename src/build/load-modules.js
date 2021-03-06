'use strict';

/******************
 *  Dependencies  *
 ******************/

var handlebars = require('handlebars');
var Promise = require('promise');
var path = require('path');
var cheerio = require('cheerio');
var extend = require('extend');
var log = require('../logger');

/***************
 *  Functions  *
 ***************/

/**
 * Tries to compile the given handlebars hbs
 * @param {String} content The hbs to template
 */
function handlebarsCompile(content) {
    var result;

    try {
        result = handlebars.compile(content);
    } catch (err) {
        log('Handlebars', err, 'error');
        result = handlebars.compile('<span></span>');
    }

    return result;
}

/**
 *
 * @param {type} [name] [description]
 */
function moduleHelper(context, module, object) {
    var template, html, doc, data;
    var handlebarsData = object.data;
    var name = object.name.replace('module-', '');
    var hash = object.hash || {};
    var defaults = module.defaults || {};
    var page = handlebarsData.root = handlebarsData.root || {};

    // Use an alternate template file if requested
    if (hash.template) {
        template = module.templates[hash.template];
        delete hash.template;
    } else {
        template = module.template;
    }

    // Include resource data
    if (hash.data && context.resources[hash.data]) {
        data = context.resources[hash.data];
    } else { data = {}; }

    page._modules = page._modules || {};

    // Add module to list of modules
    page._modules[name] = module;

    // Combine data
    page = extend(page, defaults, hash);
    page.data = data;

    // Generate the HTML
    html = template ? template(page) : '<span></span>';

    // Add data-module attribute
    doc = cheerio.load(html);
    if (module.script) { doc(':root').attr('data-module', name); }

    // Return the generated HTML
    return new handlebars.SafeString(doc.html());
}

/**
 *
 * @param {type} [name] [description]
 */
function recursiveLoad(context, files, modules, registerHelper, crumbs) {
    var name, templateName, mod;

    // Determine the module name or instantiate crumbs
    if (crumbs) {
        name = crumbs.join('-');
        mod = modules[name] = { name: name };
    }
    else { crumbs = []; }

    // Process every entry in files
    for (var i in files) {
        switch (i) {
            case 'index.hbs':
                mod.template = files['index.hbs'] ? handlebars.compile(files['index.hbs']) : null;
                break;
            case 'defaults.json':
                mod.defaults = files['defaults.json'] ? JSON.parse(files['defaults.json']) : {};
                break;
            case 'main.scss':
                mod.sass = files['main.scss'];
                break;
            case 'index.js':
                mod.script = files['index.js'];
                break;

            default:

                // Collect additional templates
                if (path.extname(i) === '.hbs') {
                    templateName = path.basename(i, '.hbs');
                    mod.templates = mod.templates || {};
                    mod.templates[templateName] = handlebarsCompile(files[i]);
                }

                // Process folders
                else if (files[i] === Object(files[i])) {
                    crumbs.push(i);
                    name = crumbs.join('-');

                    // Continue recursion
                    recursiveLoad(context, files[i], modules, registerHelper, crumbs);

                    // Register the helper
                    if (modules[name]) {
                        registerHelper('module-' + name, moduleHelper.bind(null, context, modules[name]));
                    }

                    crumbs.pop();
                }
        }
    }

    crumbs.pop();
}

/*************
 *  Exports  *
 *************/

module.exports = function (context) {
    var files = context.app.modules || {};

    context.modules = context.modules || {};

    return new Promise(function(resolve) {
        try {
            recursiveLoad(context, files, context.modules, handlebars.registerHelper.bind(handlebars));
            resolve(context);
        } catch (err) {
            log('Handlebars', err, 'error');
        }

        resolve(context);
    });
};
