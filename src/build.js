'use strict';

/******************
 *  Dependencies  *
 ******************/

var readDirFiles = require('read-dir-files');
var handlebars = require('handlebars');
var path = require('path');
var extend = require('extend');
var cheerio = require('cheerio');
var del = require('del');
var fse = require('fs-extra');
var browserify = require('browserify');
var hbsfy = require('hbsfy');
var debowerify = require('debowerify');
var installify = require('installify');
var envify = require('envify');
var sass = require('node-sass');

/**************
 *  Partials  *
 **************/

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
            name = path.basename(name, '.hbs');
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

/**********
 *  Site  *
 **********/

/**
 * 
 * @param {type} [name] [description]
 */
function processSite(files, site, sitePath) {
    var key, pageFile, pages, templateFn, sass;
    var defaults = {};
    var keys = Object.keys(files);

    sitePath = sitePath || [];
    site = site || {};

    // Establish site entry
    if (files['index.hbs']) {

        // Key by the file's path
        sitePath.push('index.html');
        key = sitePath.join('/');
        site[key] = {
            key: key,
            template: handlebars.compile(files['index.hbs']),
            modules: []
        };
        sitePath.pop();

        // Remove the index.hbs key
        keys.splice(keys.indexOf('index.hbs'), 1);

        // Add style
        if (files['main.scss']) {
            sass = site[key].sass = files['main.scss'];

            // Remove the main.scss key
            keys.splice(keys.indexOf('main.scss'), 1);
        }

        // Add scripts
        if (files['index.js']) {
            site[key].script = files['index.js'];
            keys.splice(keys.indexOf('index.js'), 1);
        }
    }

    // Get default data
    if (files['defaults.json']) {
        defaults = JSON.parse(files['defaults.json']);
        if (site[key]) { site[key].data = defaults; }
    }

    // Populate based on pages.json
    if (files['pages.json']) {
        pageFile = JSON.parse(files['pages.json']);

        // Get the template key
        for (var template in pageFile) {
            pages = pageFile[template];
            templateFn = handlebars.compile(files[template]);

            // Add additional pages to site
            for (var page in pages) {
                sitePath.push(page + '.html');
                key = sitePath.join('/');
                site[key] = {
                    key: key,
                    template: templateFn,
                    data: extend({}, defaults, pages[page]),
                    sass: sass,
                    modules: [],
                    script: files['index.js']
                };
                sitePath.pop();
            }
        }

        keys.splice(keys.indexOf('pages.json'), 1);
    }

    // Continue recursing with remaining keys
    keys.forEach(function(key) {
        
        // Only recurse directories
        if (!path.extname(key)) {
            sitePath.push(key);
            processSite(files[key], site, sitePath);
            sitePath.pop();
        }
    });

    return site;
}

/****************
 *  Templating  *
 ****************/

/**
 * 
 * @param {type} [name] [description]
 */
function moduleHelper(module, object) {
    var html, doc;
    var data = object.data;
    var name = object.name;
    var hash = object.hash;
    var page = data.root ? data.root : null;

    name = name.replace('module-', '');

    // Add module to list of modules
    if (page && page.modules && page.modules.indexOf(name) < 0) {
        page.modules.push(name);
    }

    // Combine data
    page = extend(page, module.defaults, hash);

    // Generate the HTML
    html = module.template ? module.template(page) : '<span></span>';

    // Add data-module attribute
    doc = cheerio.load(html);
    doc(':root').attr('data-module', 'module/' + name);

    // Return the generated HTML
    return new handlebars.SafeString(doc.html());
}

/**
 * Registers all modules as handlebars helpers
 * @param {type} [name] [description]
 */
function registerModules(files, modules) {
    var module, modFiles;
    modules = modules || {};

    for (var key in files) {
        modFiles = files[key];

        // Resolve module source
        module = modules['module-' + key] = {
            template: modFiles['index.hbs'] ? handlebars.compile(modFiles['index.hbs']) : null,
            defaults: modFiles['defaults.json'] ? JSON.parse(modFiles['defaults.json']) : {},
            sass: modFiles['main.scss'],
            script: modFiles['index.js']
        };

        handlebars.registerHelper('module-' + key, moduleHelper.bind(null, module));
    }

    return modules;
}

/**
 * Expands all handlebars templates, generating all content
 * for each page in to a single string.
 * @param {type} [name] [description]
 */
function expandTemplates(site) {
    var page, data;

    for (var key in site) {
        page = site[key];
        data = page.data;

        if (data) {
            delete page.data;
            page = extend(page, data);
        }

        page.content = page.template(page);
    }
}

/************
 *  Assets  *
 ************/

/**
 * Replaces all instances of assets:// with the ASSETS_URL
 * environment variable
 * @param {String} content
 */
function replaceAssets(assets) {
    return function(content) {
        return content.replace('assets://', assets);
    };
}

/**
 * Injects a <script src=...> tag in to the given content
 * @param {type} [name] [description]
 */
function injectScriptRef() {
    var comment = '<!-- Inline Scripts -->';
    var tag = '<script src="index.js"></script>';

    return function(content) {
        return content.replace(comment, tag);
    };
}

/**
 * Injects a <link rel=...> tag in to the given content
 * @param {type} [name] [description]
 */
function injectStyleRef() {
    var comment = '<!-- Inline Styles -->';
    var tag = '<link rel="stylesheet" type="text/css" href="main.css">';

    return function(content) {
        return content.replace(comment, tag);
    };
}

/**************
 *  File I/O  *
 **************/

/**
 * Writes HTML to the distribution folder
 * @param {type} [name] [description]
 */
function writeHTML(site, dest, filters) {
    var content, filePath;

    for (var page in site) {
        filePath = path.join(dest, page);
        content = site[page].content;

        if (filters) {
            filters.forEach(function(filter) {
                content = filter(content);
            });
        }

        fse.outputFile(filePath, content, function(err) {
            if (err) { console.log(err); }
        });
    }
}

/**
 * Writes all javascript files using browserify
 * @param {type} [name] [description]
 */
function writeScripts(site, src, dest, modules, filters) {
    var filePath, b;

    // Add modules
    for (var page in site) {
        b = browserify({ debug: true });

        // Add transforms
        b.transform(hbsfy);
        b.transform(debowerify);
        b.transform(installify);
        b.transform(envify);

        // Add modules
        site[page].modules.forEach(function(mod) {
            var name = mod.replace('module-', '');
            var modulePath = path.join(src, 'modules', name);

            b.require(modulePath, {
                expose: 'module/' + name
            });
        });

        // Add module runner js
        b.add(path.join(__dirname, 'client-runmodules.js'));

        // Add index.js
        if (site[page].script) {
            b.add(path.join(src, 'site', path.dirname(page), 'index.js'));
        }

        // Get path to new index.js
        filePath = path.join(dest, path.dirname(page), 'index.js');

        // Create the bundle
        b.bundle(function(destPath, err, buffer) {
            var content = buffer.toString();

            if (filters) {
                filters.forEach(function(filter) {
                    content = filter(content);
                });
            }

            // Write the bundled file
            fse.outputFile(destPath, content, function(err) {
                if (err) { console.log(err); }
            });
        }.bind(null, filePath));
    }
}

/***********
 *  Build  *
 ***********/

module.exports = function build(src, dest) {
    var site, modules;

    // Read the entire src tree
    readDirFiles.read(src, 'utf8', function(err, files) {

        // Add partials
        registerPartials(files.partials);

        // Process site
        site = processSite(files.site);

        // Registers all module helpers
        modules = registerModules(files.modules);

        // Perform template expansion
        expandTemplates(site);

        // Clean distribution folder
        del(dest, function() {
            var debugPath = path.join(dest, 'debug');

            // Write HTML to debug distribution
            writeHTML(site, debugPath, [
                replaceAssets('/assets/'),
                injectScriptRef(),
                injectStyleRef()
            ]);

            // Write JS to debug distribution
            writeScripts(site, src, debugPath, modules, [
                replaceAssets('/assets')
            ]);
        });
    });
};
