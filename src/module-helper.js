'use strict';

/******************
 *  Dependencies  *
 ******************/

var handlebars = require('handlebars');
var cheerio = require('cheerio');

/************
 *  Helper  *
 ************/

/**
 * The module loader helper is a Handlebars helper. It permits the use of
 * templating tags such as {{module "path/to/module"}}. These tags are replaced
 * with templated module markup (from a module's .hbs file). Data may be passed to
 * a module in a variety of ways (applied in this order):
 *
 * 1.) A defaults.json file in the module's folder
 * 2.) Individual data overrides in the tag,
 *     {{module "path/to/module" val1="lime" val2=5}}
 */
function moduleHelper(moduleName, options, moduleList, files) {
    var template, html, doc;
    var moduleHTML = files.modules;
    var path = moduleName.split('/');
    var hash = options.hash;
    var data = {};

    // Navigate file tree
    path.forEach(function(step) {
        moduleHTML = moduleHTML[step];
    });

    // Get the module's template markup
    moduleHTML = moduleHTML['module.hbs'];

    // Add to the list of modules
    if (moduleList.indexOf(moduleName) < 0) {
        moduleList.push(moduleName);
    }

    // Collect extra data
    if (hash) {
        for (var i in hash) {
            data[i] = hash[i];
        }
    }

    // Template handlebars
    if (moduleHTML) {
        template = handlebars.compile(moduleHTML);
        html = template(data);
    } else {
        html = '<span></span>';
    }

    // Add data-module attribute
    doc = cheerio.load(html);
    doc(':root').attr('data-module', moduleName);

    // Return templated html
    return new handlebars.SafeString(doc.html());
}

/*************
 *  Exports  *
 *************/

module.exports = function(files, site, moduleList, modulePath) {
    var helper;
    modulePath = modulePath || [];

    for (var file in files) {
        if (file === 'index.hbs') {
            helper = moduleHelper.bind(null, site, moduleList, files[file]);
            handlebars.registerHelper('module/' + modulePath.join('/'), helper);
        }
    }
};
