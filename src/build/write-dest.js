'use strict';

/******************
 *  Dependencies  *
 ******************/

var fs = require('fs');
var Promise = require('promise');
var path = require('path');
var mkdirp = require('mkdirp');

/***************
 *  Functions  *
 ***************/

/**
 * Recursively writes an object to a destination folder. If
 * a cache object is provided, it will be checked 
 * @param {type} [name] [description]
 */
function recursiveWrite(src, writeFile, crumbs) {
    var dest, folder, crumbsCopy;
    var promises = [];
    var settings = this.settings;

    // Begin dropping crumbs
    crumbs = crumbs || [];

    // Cycle through all files
    for (var i in src) {

        // Ignore leading _
        if (i.indexOf('_') === 0) { continue; }

        // Write strings and buffers
        if (typeof src[i] === 'string' || src[i] instanceof Buffer) {
            folder = crumbs.join(path.sep);
            crumbs.push(i);
            dest = crumbs.join(path.sep);

            // Write the file, adding to promises
            promises.push(new Promise(function(dest, content, resolve, reject) {
                var folder;
                var crumbs = dest.split(path.sep);

                // Determine destination folder
                crumbs.pop();
                folder = crumbs.join(path.sep);

                // Create folder first
                mkdirp(folder, function(err) {
                    if (err) { reject('[write-dest.js] ' + err); return; }

                    writeFile(dest, content, function(err) {
                        if (err) { reject('[write-dest.js] ' + err); }
                        else { resolve(); }
                    });
                });
            }.bind(this, dest, src[i])));

            crumbs.pop();

        // Create folder in cache and continue recursing
        } else if (src[i] === Object(src[i])) {

            // Continue recursive asynchronous write
            crumbs.push(i);
            crumbsCopy = Array.prototype.slice.call(crumbs, 0);

            promises.push(new Promise(function(folder, crumbs, resolve) {
                resolve(recursiveWrite.call(this, folder, writeFile, crumbs));
            }.bind(this, src[i], crumbsCopy)));

            crumbs.pop();
        }
    }

    return Promise.all(promises);
}

/*************
 *  Exports  *
 *************/

module.exports = function(context) {
    var dest;
    var fsWrite = fs.writeFile.bind(fs);

    dest = path.join(process.cwd(), context.settings.dest);

    return new Promise(function(resolve) {
        recursiveWrite.call(context, context.dist, fsWrite, [dest])
            .then(function() {
                resolve(context);
            }).catch(function(err) {
                console.error(err);
            });
    });
};
