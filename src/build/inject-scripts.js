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
var scriptTag = '<script src="index.js" type="text/javascript"></script>';
var styleComment = '<!-- Inject Styles -->';
var styleTag = '<link rel="stylesheet" type="text/css" href="main.css">';

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
function recursiveInject(dest, doInjectScripts, doInjectStyles) {
    var scriptText = dest['index.js'] ?
        doInjectScripts ?
            scriptStartTag + dest['index.js'] + scriptEndTag :
            scriptTag :
        '';
    var styleText = dest['main.css'] ?
        doInjectStyles ?
            styleStartTag + dest['main.css'] + styleEndTag :
            styleTag :
        '';

    // Remove script & style files
    if (doInjectScripts) { delete dest['index.js']; }
    if (doInjectStyles) { delete dest['main.css']; }

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
            recursiveInject(dest[i], doInjectScripts, doInjectStyles);
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
            recursiveInject(context.dist, doInjectScripts, doInjectStyles);
            resolve(context);
        } catch(err) {
            reject('[inject-tags.js] ' + err);
        }
    });
};
