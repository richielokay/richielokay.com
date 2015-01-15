'use strict';

/******************
 *  Dependencies  *
 ******************/

var swig = require('swig');
var readdir = require('recursive-readdir');
var path = require('path');
var normalizeSettings = require('./normalize-settings');
var fs = require('fs');

/**************
 *  Settings  *
 **************/

try {
    var buildSettings = require(path.join(process.cwd(), '.builds.json'));
    var settings = normalizeSettings(buildSettings);
} catch (err) {
    console.warn('Could not find .builds.json');
}

/*************
 *  Exports  *
 *************/

module.exports = function createModule(name) {
    var shortPath = path.join(settings[0].src, 'modules', name);
    var modulePath = path.join(process.cwd(), shortPath);
    var templateDir = path.resolve('../scaffolds/module');
    var data = { name: name };

    if (fs.existsSync(modulePath)) {
        console.error('Module ' + name + ' already exists');
        return;
    }

    fs.mkdir(modulePath, function() {
        readdir(templateDir, function(err, files) {
            var numFiles = files.length;

            if (err) { throw new Error(err); }

            files.forEach(function(file) {
                var tmpl;
                var basename = path.basename(file);
                var dest = path.join(modulePath, path.basename(file));
                
                tmpl = swig.compileFile(file);

                fs.writeFile(dest, tmpl(data), function(name, err) {
                    if (err) { throw new Error(err); }
                    numFiles--;

                    if (!numFiles) { console.log('Module created at ' + shortPath); }
                }.bind(null, basename));
            });
        });
    });
};
