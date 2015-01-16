'use strict';

/******************
 *  Dependencies  *
 ******************/

var swig = require('swig');
var readdir = require('recursive-readdir');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

/*************
 *  Exports  *
 *************/

module.exports = function createProject(name) {
    var data;
    var templateDir = path.join(__dirname, '../scaffolds/project');

    // Get the name from the current folder if none given
    name = name || process.cwd().split(path.sep).pop();

    data = { name: name };

    // Read out a list of existing files
    readdir(process.cwd(), function(err, existing) {
        readdir(templateDir, function(err, files) {
            var numFiles = files.length;

            if (err) { throw new Error(err); }

            files.forEach(function(file) {
                var tmpl;
                var relPath = file.replace(templateDir + '/', '');
                var dest = path.join(process.cwd(), relPath);
                
                tmpl = swig.compileFile(file);

                // Skip existing files
                if (existing.indexOf(dest) >= 0) {
                    numFiles--;
                } else {
                    mkdirp(path.dirname(dest), function() {
                        fs.writeFile(dest, tmpl(data), function(err) {
                            if (err) { throw new Error(err); }

                            numFiles--;

                            if (!numFiles) { console.log('Project created.'); }
                        });
                    });
                }
            });
        });
    });

    // Manually create empty folders
    mkdirp(path.join(process.cwd(), 'assets', 'images'));
    mkdirp(path.join(process.cwd(), 'app', 'styles'));

};
