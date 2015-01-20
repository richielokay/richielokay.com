'use strict';

/******************
 *  Dependencies  *
 ******************/

var handlebars = require('handlebars');
var Promise = require('promise');

/*************
 *  Methods  *
 *************/

/**
 * 
 * @param {type} [name] [description]
 */
function recursiveLoad(modules) {
    var module;

    return new Promise(function(resolve, reject) {
        resolve(app);
    });
}

/*************
 *  Exports  *
 *************/

module.exports = function (context) {
    var modules = context.app.modules || {};

    return new Promise(function(resolve, reject) {
        try {
            recursiveLoad(partials, handlebars.registerPartial.bind(handlebars));
            resolve(context);
        } catch (err) {
            reject(err);
        }
    });
};
