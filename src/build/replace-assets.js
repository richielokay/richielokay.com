'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');

/***************
 *  Variables  *
 ***************/

var key = /assets:\/\//g;

/***************
 *  Functions  *
 ***************/

/**
 * Replaces all instances of assets:// with the
 * appropriate value
 */
function recursiveReplace(target, oldVal, newVal) {
    for (var i in target) {

        // Ignore _
        if (i.indexOf('_') === 0) { continue; }

        // Replace instances of assets://
        if (typeof target[i] === 'string') {
            target[i] = target[i].replace(oldVal, newVal);
        }

        // Continue recursion
        else if (target[i] === Object(target[i])) {
            recursiveReplace(target[i], oldVal, newVal);
        }
    }
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var assets = context.settings.env.ASSETS_URL || '/assets/';

    return new Promise(function(resolve, reject) {
        try {
            recursiveReplace(context.dist, key, assets);
            resolve(context);
        } catch(err) {
            reject('[replace-assets.js] ' + err);
        }
    });
};
