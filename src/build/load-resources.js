'use strict';

/*******************
 *  Dependencies  *
 *******************/

var fs = require('fs');
var Promise = require('promise');
var path = require('path');
var log = require('../logger');
var http = require('http');
var https = require('https');

/***************
 *  Variables  *
 ***************/

var cwd = process.cwd();

/***************
 *  Functions  *
 ***************/

/**
 * 
 * @param {type} [name] [description]
 */
function httpGet(resources, name, src) {
    return new Promise(function(resolve) {
        try {
            var json = '';
            var protocol = src.indexOf('https://') === 0 ? https : http;

            protocol.get(src, function(res) {

                res.on('data', function(data) {
                    json += data.toString();
                });

                res.on('end', function() {
                    resources[name] = JSON.parse(json);
                    resolve();
                    log('Resources', 'Loaded ' + name);
                });

                res.on('error', function(err) {
                    log('Resources', err, 'error');
                    resolve();
                });
            });
        } catch(err) {
            log('Resources', err, 'error');
            resolve();
        }
    });
}

/**
 * 
 * @param {type} [name] [description]
 */
function callLoader(resources, name, filePath) {
    var requirePath;
    var msg;

    // Generate path compliant with require()
    requirePath = filePath.split('.');
    requirePath.pop();
    requirePath = requirePath.join('.');

    return new Promise(function(resolve) {
        fs.exists(filePath, function(exists) {
            if (exists) {
                require(requirePath).then(function(data) {
                    resources[name] = data;
                    log('Resources', 'Loaded ' + name);
                    resolve();
                }).catch(function(err) {
                    log('Resources', err, 'error');
                });
            }
            else {
                msg = 'Could not find ' + filePath;
                log('Resources', msg, 'warning');
                resolve();
            }
        });
    });
}

/**
 * Loads a resource in to the context
 */
function loadResources(context, resourceList) {
    var filePath;
    var cwd = process.cwd();
    var promises = [];

    context.resources = context.resources || {};

    // Load all resources, adding promises to the collection
    for (var i in resourceList) {

        // Use an external loader
        if (resourceList[i].loader) {
            filePath = path.join(cwd, resourceList[i].loader);
            promises.push(callLoader(context.resources, i, filePath));  
        }

        // Perform an http get request
        else if (resourceList[i].src) {
            promises.push(httpGet(context.resources, i, resourceList[i].src));
        }
    }

    return Promise.all(promises);
}

/*************
 *  Exports  *
 *************/

 module.exports = function(context) {
    var resourceFile = path.join(cwd, 'resources.json');

    return new Promise(function(resolve) {

        // Check if a resources.json file exists
        fs.exists(resourceFile, function(exists) {
            if (exists) {
                fs.readFile(resourceFile, function(err, content) {
                    if (err) {
                        log('Resources', err, 'error');
                        resolve(context);
                    }

                    // Asynchronously load resources
                    else {
                        loadResources(context, JSON.parse(content.toString()))
                            .then(function() {
                                resolve(context);
                            });
                    }
                });
            }

            else { resolve(context); }
        });
    });
 };
