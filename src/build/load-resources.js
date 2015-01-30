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
 * Loads a resource in to the context
 */
function loadResources(context, resources) {
    var promises = [];

    context.resources = context.resources || {};

    for (var i in resources) {
        promises.push(new Promise(function(name, resolve) {
            try {
                var json = '';
                var resource = resources[name];
                var protocol = resource.src.indexOf('https://') === 0 ? https : http;

                protocol.get(resources[name].src, function(res) {
                    
                    res.on('data', function(data) {
                        json += data.toString();
                    });

                    res.on('end', function() {
                        context.resources[name] = JSON.parse(json);
                        resolve();
                        log('Resources', 'Loaded ' + name);
                    });

                    res.on('error', function() {
                        log('Resources', err, 'error');
                        resolve();
                    });
                });
            } catch(err) {
                log('Resources', err, 'error');
                resolve();
            }
        }.bind(null, i)));
    }

    return Promise.all(promises);
}

/*************
 *  Exports  *
 *************/

 module.exports = function(context) {
    var resourceFile = path.join(cwd, 'resources.json');

    return new Promise(function(resolve) {
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
            } else {
                resolve(context);
            }
        });
    });
 };
