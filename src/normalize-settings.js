'use strict';

/******************
 *  Dependencies  *
 ******************/

var extend = require('extend');

/**************
 *  Defaults  *
 **************/

var defaults = {
    name: '',
    dest: 'dist/prod',
    src: 'app',
    packed: false,
    browserify: {
        debug: false
    },
    sass: {
        sourcemaps: false,
        outputStyle: 'nested',
        includePaths: []
    },
    env: {
        NODE_ENV: 'production',
        ASSETS_URL: '/assets/'
    },
    html: { lrSnippet: false },
    assetSrc: 'assets',
    assetDest: 'dist/prod/assets'
    // server: {
    //     'port': 8080,
    //     'lrPort': 35729
    // }
};

//
module.exports = function normalize(settings) {
    var result = [];

    settings.forEach(function(build) {
        result.push(extend({}, defaults, build));
    });

    return result;
};
