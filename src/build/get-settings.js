'use strict';

/******************
 *  Dependencies  *
 ******************/

var extend = require('extend');
var path = require('path');
var defaults = require(path.join(__dirname, 'defaults.json'));

/***************
 *  Variables  *
 ***************/

var BUILDS_JSON_PATH = path.join(process.cwd(), 'builds.json');

/*************
 *  Methods  *
 *************/

/**
 * [normalize description]
 * @param  {Object} def default settings
 * @param  {Object} settings applied settings
 * @return {Object}
 */
function normalize(def, settings) {
    var result = {};

    extend(result, def, settings);

    return result;
}

/*************
 *  Exports  *
 *************/

module.exports = function getSettings(name) {
    var settings;

    // Try loading a builds.json file
    try {
        settings = require(BUILDS_JSON_PATH);
        settings = settings.filter(function(item) {
            return item.name === name;
        })[0];
        
        return normalize(defaults, settings);
    }
    catch (err) { return defaults; }
};
