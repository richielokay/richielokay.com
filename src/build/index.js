'use strict';

/*************
 *  Modules  *
 *************/

var Promise = require('promise');
var getSettings = require('../get-settings');
var loadApp = require('./load-app');
var updateApp = require('./update-app');
var templateSiteHTML = require('./template-site-html');
var loadPartials = require('./load-partials');
var loadModules = require('./load-modules');
var writeContext = require('./write-context');
var cleanFolder = require('./clean-folder');
var writeDest = require('./write-dest');
var templatePages = require('./template-pages-html');
var compileScripts = require('./compile-scripts');
var compileStyles = require('./compile-styles');
var rebuildScripts = require('./rebuild-scripts');
var injectScripts = require('./inject-scripts');
var replaceAssets = require('./replace-assets');
var staticServe = require('../server/static-server');
var liveReloadServe = require('../server/livereload-server');
var createWatcher = require('../server/create-watcher');
var triggerLivereload = require('../server/trigger-livereload');
var copyAssets = require('./copy-assets');
var log = require('../logger');
var gzip = require('./gzip-compress');
var listBowerComponents = require('./list-bower-components');
var loadResources = require('./load-resources');
var includeVersion = require('./include-version');
var versionPrefix = require('./version-prefix');

/***********
 *  Tasks  *
 ***********/

/**
 * Runs updates
 * @param {Object} context The context to update
 */
function updateScripts(context) {
    var start = Date.now();

    return rebuildScripts(context)
        .then(includeVersion)
        .then(replaceAssets)
        .then(versionPrefix)
        .then(gzip)
        .then(writeDest)
        .then(triggerLivereload)
        .then(writeContext)
        .then(function(context) {
            log('Blanka', 'Built in ' + (Date.now() - start) / 1000 + 's');
            return Promise.resolve(context);
        })
        .catch(function(err) {
            if (err) { console.log(err); }
        });
}

/**
 * Runs updates
 * @param {Object} context The context to update
 */
function updateNoScripts(context, file, evt) {
    var start = Date.now();

    return updateApp(context, file, evt)
        .then(includeVersion)
        .then(loadPartials)
        .then(loadModules)
        .then(templateSiteHTML)
        .then(templatePages)
        .then(compileStyles)
        .then(injectScripts)
        .then(replaceAssets)
        .then(versionPrefix)
        .then(gzip)
        .then(writeDest)
        .then(triggerLivereload)
        .then(writeContext)
        .then(function(context) {
            log('Blanka', 'Built in ' + (Date.now() - start) / 1000 + 's');
            return Promise.resolve(context);
        })
        .catch(function(err) {
            if (err) { console.log(err); }
        });
}

/**
 * Runs updates
 * @param {Object} context The context to update
 */
function update(context, file, evt) {
    var start = Date.now();

    return updateApp(context, file, evt)
        .then(includeVersion)
        .then(loadPartials)
        .then(loadModules)
        .then(templateSiteHTML)
        .then(templatePages)
        .then(rebuildScripts)
        .then(compileStyles)
        .then(injectScripts)
        .then(replaceAssets)
        .then(versionPrefix)
        .then(gzip)
        .then(writeDest)
        .then(triggerLivereload)
        .then(writeContext)
        .then(function(context) {
            log('Blanka', 'Built in ' + (Date.now() - start) / 1000 + 's');
            return Promise.resolve(context);
        })
        .catch(function(err) {
            if (err) { console.log(err); }
        });
}

/**
 * Updates assets, copying them to the dist folder
 */
function updateAssets(context) {
    return copyAssets(context);
}

/**
 * The initial build task to run
 * @param {Object} context The context to initialize
 */
function init(context) {
    var start = Date.now();

    log('Blanka', 'Running initial build...');

    return loadResources(context)
        .then(loadApp)
        .then(includeVersion)
        .then(loadPartials)
        .then(loadModules)
        .then(templateSiteHTML)
        .then(templatePages)
        .then(cleanFolder(context.settings.dest))
        .then(compileScripts(function() {
            return updateScripts(context);
        }))
        .then(compileStyles)
        .then(injectScripts)
        .then(replaceAssets)
        .then(versionPrefix)
        .then(gzip)
        .then(writeDest)
        .then(copyAssets)
        .then(writeContext)
        .then(function(context) {
            var delta = Math.round((Date.now() - start) / 1000);
            log('Blanka', 'Build Completed in ' + delta + 's', null, true);
            return Promise.resolve(context);
        })
        .catch(function(err) {
            if (err) { console.error(err); }
        });
}

/***********
 *  Build  *
 ***********/

module.exports = function build(name) {
    var settings = getSettings(name);
    var context = { settings: settings };

    return init(context)
        .then(staticServe)
        .then(liveReloadServe)
        .then(createWatcher(settings.src, function(file, evt) {
            return updateNoScripts(context, file, evt);
        }))
        .then(createWatcher(settings.assets.src, function() {
            return updateAssets(context);
        }));
};
