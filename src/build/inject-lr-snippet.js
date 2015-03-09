'use strict';

/******************
 *  Dependencies  *
 ******************/

var cheerio = require('cheerio');

/***************
 *  Variables  *
 ***************/

var lrSnippet = '<script>document.write(\'<script src=\"http://\' + (location.host || \'localhost\').split(\':\')[0] + \':$PORT/livereload.js?snipver=1\"></\' + \'script>\')</script>';

/*************
 *  Exports  *
 *************/

module.exports = function(html, port) {
    var doc = cheerio.load(html);

    port = port || 35729;
    lrSnippet = lrSnippet.replace('$PORT', port.toString());

    doc('body').append(lrSnippet);

    return doc.html();
};
