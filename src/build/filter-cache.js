'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var extend = require('extend');

/***************
 *  Functions  *
 ***************/

/**
 * Returns the difference between two objects, selecting for keys
 * only on obj
 * @param {Object} obj The first object to compare
 * @param {Object} cache The second object to compare
 */
function diffCache(obj, cache) {
    var diffObj = {};

    for (var i in obj) {
        
        // Skip _
        if (i.indexOf('_') === 0) { continue; }

        // Include changed items in diff and update cache
        if (obj[i] !== cache[i] && obj !== Object(obj)) {
            cache = cache || {};
            cache[i] = obj[i];
            diffObj[i] = obj[i];
        }

        // Continue recursion
        else if (obj[i] === Object(obj[i])) {
            cache[i] = cache[i] || {};
            diffObj[i] = diffCache(obj[i], cache[i]);
        }
    }

    return diffObj;
}

/*************
 *  Exports  *
 *************/

module.exports = function() {
    var cache;

    return function(context) {
        return new Promise(function(resolve, reject) {
            try {
                
                // Create the cache for the first time
                if (!cache) {
                    cache = extend(true, {}, context.dist);

                // Diff the distribution with the cache
                } else {
                    context.dist = diffCache(context.dist, cache);
                }

                resolve(context);
            }
            catch(err) {
                reject('[filter-cache.js] ' + err);
            }
        });
    };
};
