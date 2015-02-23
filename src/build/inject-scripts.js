'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var path = require('path');

/***************
 *  Variables  *
 ***************/

var scriptComment = '<!-- Inject Scripts -->';
var scriptTag = '<script src="%s" type="text/javascript"></script>';
var styleComment = '<!-- Inject Styles -->';
var styleTag = '<link rel="stylesheet" type="text/css" href="%s">';

var scriptStartTag = '<script type="text/javascript">';
var scriptEndTag = '</script>';
var styleStartTag = '<style>';
var styleEndTag = '</style>';

/***************
 *  Functions  *
 ***************/

/**
 * Recursively injects script tags to all pages
 * in a site
 */
function recursiveInject(context, dest, doInjectScripts, doInjectStyles, crumbs) {
    var fullPath, version, jsFilename, cssFilename, scriptText, styleText;
    
    crumbs = crumbs || [];

    // Determine script injection string
    fullPath = crumbs.length ? crumbs.join('/') : null;
    version = context.version;
    jsFilename = (version ? '/scripts/' + version + '/' + (fullPath ? fullPath + '/' : '' ) : '') + 'index.js';
    cssFilename = (version ? '/styles/' + version + '/' + (fullPath ? fullPath + '/' : '' ) : '') + 'main.css';
    scriptText = dest['index.js'] ?
        doInjectScripts ?
            scriptStartTag + dest['index.js'] + scriptEndTag :
            scriptTag.replace('%s', jsFilename) :
        '';
    styleText = dest['main.css'] ?
        doInjectStyles ?
            styleStartTag + dest['main.css'] + styleEndTag :
            styleTag.replace('%s', cssFilename) :
        '';

    // Remove script & style files
    if (doInjectScripts) { delete dest[jsFilename]; }
    if (doInjectStyles) { delete dest[cssFilename]; }

    // Cycle through all folders/files in dest
    for (var i in dest) {

        // Inject the text
        if (path.extname(i) === '.html') {
            dest[i] = dest[i].replace(scriptComment, scriptText);
            dest[i] = dest[i].replace(styleComment, styleText);
        }

        // Continue recursion
        else if (dest[i] === Object(dest[i]) &&
            i.indexOf('_') !== 0)
        {
            crumbs.push(i);
            recursiveInject(context, dest[i], doInjectScripts, doInjectStyles, crumbs);
            crumbs.pop();
        }
    }
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var doInjectScripts, doInjectStyles;
    var settings = context.settings;

    // Try to get script injection setting
    try {
        doInjectScripts = settings.scripts.inject;
    } catch(err) {
        doInjectScripts = false;
    }

    // Try to get style injection setting
    try {
        doInjectStyles = settings.styles.inject;
    } catch(err) {
        doInjectStyles = false;
    }

    return new Promise(function(resolve, reject) {
        try {
            recursiveInject(context, context.dist, doInjectScripts, doInjectStyles);
            resolve(context);
        } catch(err) {
            reject('[inject-tags.js] ' + err);
        }
    });
};
