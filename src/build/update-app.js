'use strict';

/******************
 *  Dependencies  *
 ******************/

var Promise = require('promise');
var fs = require('fs');
var path = require('path');

/*************
 *  Exports  *
 *************/

module.exports = function(context, file, state) {
    var pointer;
    var filePath = path.join(process.cwd(), file);
    var crumbs = file.split(path.sep);
    var fileName = crumbs.pop();

    return new Promise(function(resolve, reject) {
        switch (state) {

            // Load changed files
            case 'change':
            case 'add':

                // Temporary hack to ignore reloading javascript
                // as it is handled by watchify
                if (path.extname(filePath) !== '.js') {

                    fs.readFile(filePath, function(err, data) {
                        var pointer = context;

                        if (err) { reject('[update-app.js] ' + err); }
                        else {
                            // Update the file's contents in the context
                            crumbs.forEach(function(crumb) {
                                pointer = pointer[crumb] || {};
                            });
                            pointer[fileName] = data.toString();
                            resolve(context);
                        }
                    });
                } else {
                    resolve(context);
                }
                break;

            // Add folder to src
            case 'addDir':
                pointer = context;
                crumbs.forEach(function(crumb) {
                    pointer = pointer[crumb] = pointer[crumb] || {};
                });
                pointer[fileName] = pointer[fileName] || {};
                resolve(context);
                break;

            // Remove file
            case 'unlink':
            case 'unlinkDir':
                pointer = context;
                crumbs.forEach(function(crumb) {
                    pointer = pointer[crumb];
                });
                delete pointer[fileName];
                resolve(context);
                break;

            default:
                resolve(context);
                break;
        }
    });
};
