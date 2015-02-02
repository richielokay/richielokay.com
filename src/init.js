'use strict';

/******************
 *  Dependencies  *
 ******************/

var swig = require('swig');
var readdir = require('recursive-readdir');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var exec = require('child_process').exec;
var log = require('./logger');
var Promise = require('promise');

/*************
 *  Exports  *
 *************/

module.exports = function createProject(name) {
    var data;
    var templateDir = path.join(__dirname, '../scaffolds/project');
    var promises = [];

    log('Blanka', 'Creating project files');

    // Get the name from the current folder if none given
    name = name || process.cwd().split(path.sep).pop();

    data = { name: name };

    // Read out a list of existing files
    promises.push(new Promise(function(resolve) {
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

                                // Resolve once everything is complete
                                if (!numFiles) { resolve(); }
                            });
                        });
                    }
                });
            });
        });
    }));


    // Manually create empty folders
    mkdirp(path.join(process.cwd(), 'assets', 'images'));
    mkdirp(path.join(process.cwd(), 'app', 'styles'));

    // Perform npm install
    promises.push(new Promise(function(resolve) {
        log('Blanka', 'Installing npm packages');
        exec('npm install', function() {
            log('Blanka', 'npm packages installed');
            resolve();
        });
    }));

    // Perform bower install
    promises.push(new Promise(function(resolve) {
        log('Blanka', 'Installing bower packages');
        exec('bower install', function() {
            log('Blanka', 'Bower packages installed');
            resolve();
        });
    }));

    // Perform all init tasks
    Promise.all(promises)
        .then(function() {
            log('Blanka', 'Project initialized. Run "blanka debug" to begin.');
            process.exit(0);
        })
        .catch(function(err) {
            log('Blanka', err, 'error');
            process.exit(1);
        });
};
