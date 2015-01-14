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
        debug: false,
        gzip: false
    },
    sass: {
        sourcemaps: false,
        outputStyle: 'nested',
        includePaths: [],
        gzip: false
    },
    env: {
        NODE_ENV: 'production',
        ASSETS_URL: '/assets/'
    },
    html: {
        lrSnippet: false,
        gzip: false
    },
    assets: {
        src: 'assets',
        dest: 'dist/prod/assets',
        gzip: false
    }
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
