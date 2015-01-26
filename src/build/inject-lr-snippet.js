'use strict';

/******************
 *  Dependencies  *
 ******************/

var cheerio = require('cheerio');

/***************
 *  Variables  *
 ***************/

var lrSnippet = '<script>document.write(\'<script src=\"http://\' + (location.host || \'localhost\').split(\':\')[0] + \':35729/livereload.js?snipver=1\"></\' + \'script>\')</script>';

/*************
 *  Exports  *
 *************/

module.exports = function(html) {
    var doc = cheerio.load(html);

    doc('body').append(lrSnippet);

    return doc.html();
};
