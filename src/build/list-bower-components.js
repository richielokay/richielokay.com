'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var bower = require('bower');

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    return new Promise(function(resolve, reject) {
        bower.commands
            .list()
            .on('end', function (response) {
                var dependencies = response.dependencies;

                context.bowerPackages = dependencies ? Object.keys(dependencies) : [];
                resolve(context);
            })
            .on('error', function(err) {
                reject(err);
            });
    });
};
