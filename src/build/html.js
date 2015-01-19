'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var cheerio = require('cheerio');

/***************
 *  Variables  *
 ***************/

var cwd = process.cwd();

/*************
 *  Methods  *
 *************/



/**
 * 
 * @param {type} [name] [description]
 */
function loadModules(app) {
    var module;
    var promises = [];
    var modules = app.modules;

    for (var name in modules) {
        module = modules[name];

        for (var file in module) {
            switch (file) {
                case 'index.hbs':
                    promises.push(new Promise(function(resolve, reject) {

                    }))
                    break;
                case 'defaults.json':
                    module.defaults = modFiles['defaults.json'] ? JSON.parse(modFiles['defaults.json']) : {};
                    break;
                case 'main.scss':
                    module.sass = modFiles['main.scss'];
                    break;
                case 'index.js':
                    module.script = modFiles['index.js'];
                    break;

                // Collect additional templates
                default:
                    if (path.extname(i) === '.hbs') {
                        templateName = path.basename(i, '.hbs');
                        module.templates = module.templates || {};
                        module.templates[templateName] = handlebarsCompile(modFiles[i]);
                    }
            }
        }
    }

    return new Promise(function(resolve, reject) {
        

        resolve(app);
    });
}

/*************
 *  Exports  *
 *************/

module.exports = function buildHTML(app) {
    return registerModules(app);
};
