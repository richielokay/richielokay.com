'use strict';

/******************
 *  Dependencies  *
 ******************/

var readDirFiles = require('read-dir-files');
var handlebars = require('handlebars');
var path = require('path');
var extend = require('extend');
var cheerio = require('cheerio');
var del = require('del');
var fs = require('fs');
var mkdirp = require('mkdirp');
var browserify = require('browserify');
var hbsfy = require('hbsfy');
var debowerify = require('debowerify');
var installify = require('installify');
var envify = require('envify');
var sass = require('node-sass');
var chokidar = require('chokidar');
var staticServer = require('node-static');
var http = require('http');
var tinylr = require('tiny-lr');
var watchify = require('watchify');
var normalizeSettings = require('./normalize-settings');
var uglifyjs = require('uglify-js');
var neat = require('node-neat');
var bourbon = require('node-bourbon');
var ncp = require('ncp');
var log = require('./logger');
var zlib = require('zlib');
var postcss = require('postcss');
var autoprefixer = require('autoprefixer-core');

/***************
 *  Variables  *
 ***************/

var settings;
var lrSnippet = '<script>document.write(\'<script src=\"http://\' + (location.host || \'localhost\').split(\':\')[0] + \':35729/livereload.js?snipver=1\"></\' + \'script>\')</script>';

/**************
 *  Partials  *
 **************/

/**
 * Recursively registers all partials in the given /partials folder
 * @param {Object} partials A list of loaded partials files
 * @param {Array} [varname] [description]
 */
function registerPartials(partials, partialPath) {
    var name;

    partialPath = partialPath || [];

    for (var item in partials) {
        
        // Register a partial
        if (path.extname(item) === '.hbs') {
            partialPath.push(path.basename(item));
            name = partialPath.join('/');
            name = path.basename(name, '.hbs');
            handlebars.registerPartial(name, partials[item]);
            partialPath.pop();
        }

        // Continue traversing directory
        else if (partials[item] === Object(partials[item])) {
            partialPath.push(item);
            registerPartials(partials[item], partialPath);
        }
    }

    partialPath.pop();
}

/**********
 *  Site  *
 **********/

/**
 * Tries to compile the given handlebars hbs
 * @param {String} content The hbs to template
 */
function handlebarsCompile(content) {
    var result;

    try {
        result = handlebars.compile(content);
    } catch (err) {
        log('Handlebars', err, 'error');
        result = handlebars.compile('<span></span>');
    }

    return result;
}

/**
 * 
 * @param {type} [name] [description]
 */
function processSite(files, site, sitePath) {
    var key, pageFile, pages, templateFn, sass;
    var defaults = {};
    var keys = Object.keys(files);

    sitePath = sitePath || [];
    site = site || {};

    // Establish site entry
    if (files['index.hbs']) {

        // Key by the file's path
        sitePath.push('index.html');
        key = sitePath.join('/');
        site[key] = site[key] || {
            key: key,
            template: handlebarsCompile(files['index.hbs']),
            modules: []
        };
        sitePath.pop();

        // Remove the index.hbs key
        keys.splice(keys.indexOf('index.hbs'), 1);

        // Add style
        if (files['main.scss']) {
            sass = site[key].sass = files['main.scss'];

            // Remove the main.scss key
            keys.splice(keys.indexOf('main.scss'), 1);
        }

        // Add scripts
        if (files['index.js']) {
            site[key].script = files['index.js'];
            keys.splice(keys.indexOf('index.js'), 1);
        }
    }

    // Get default data
    if (files['defaults.json']) {
        defaults = JSON.parse(files['defaults.json']);
        if (site[key]) { site[key].data = defaults; }
    }

    // Populate based on pages.json
    if (files['pages.json']) {
        pageFile = JSON.parse(files['pages.json']);

        // Get the template key
        for (var template in pageFile) {
            pages = pageFile[template];
            templateFn = handlebarsCompile(files[template]);

            // Add additional pages to site
            for (var page in pages) {
                sitePath.push(page + '.html');
                key = sitePath.join('/');
                site[key] = site[key] || {
                    key: key,
                    generated: true,
                    template: templateFn,
                    data: extend({}, defaults, pages[page]),
                    sass: sass,
                    modules: [],
                    script: files['index.js']
                };
                sitePath.pop();
            }
        }

        keys.splice(keys.indexOf('pages.json'), 1);
    }

    // Continue recursing with remaining keys
    keys.forEach(function(key) {
        
        // Only recurse directories (ignore dotfiles)
        if (!path.extname(key) && key.indexOf('.') !== 0) {
            sitePath.push(key);
            processSite(files[key], site, sitePath);
            sitePath.pop();
        }
    });

    return site;
}

/****************
 *  Templating  *
 ****************/

/**
 * 
 * @param {type} [name] [description]
 */
function moduleHelper(module, object) {
    var html, doc, template;
    var data = object.data;
    var name = object.name;
    var hash = object.hash;
    var page = data.root ? data.root : null;

    name = name.replace('module-', '');

    // Use an alternate template file if requested
    if (hash.template) {
        template = module.templates[hash.template];
    } else {
        template = module.template;
    }

    // Add module to list of modules
    if (page && page.modules && page.modules.indexOf(name) < 0) {
        page.modules.push(name);
    }

    // Combine data
    page = extend(page, module.defaults, hash);

    // Generate the HTML
    html = template ? template(page) : '<span></span>';

    // Add data-module attribute
    doc = cheerio.load(html);

    // Attach data-module identifier for running client side module code
    if (module.script) {
        doc(':root').attr('data-module', 'module/' + name);
    };

    // Return the generated HTML
    return new handlebars.SafeString(doc.html());
}

/**
 * Registers all modules as handlebars helpers
 * @param {type} [name] [description]
 */
function registerModules(files, modules) {
    var module, modFiles, templateName;
    modules = modules || {};

    for (var key in files) {
        modFiles = files[key];

        module = modules['module-' + key] = {};

        for (var i in modFiles) {
            switch (i) {
                case 'index.hbs':
                    module.template = modFiles['index.hbs'] ? handlebars.compile(modFiles['index.hbs']) : null;
                    break;
                case 'defaults.json':
                    module.defaults = modFiles['defaults.json'] ? JSON.parse(modFiles['defaults.json']) : {};
                    break;
                case 'main.scss':
                    module.sass = modFiles['main.scss'];
                    break;
                case 'index.js':
                    module.script = modFiles['index.js'];
                    break;

                // Collect additional templates
                default:
                    if (path.extname(i) === '.hbs') {
                        templateName = path.basename(i, '.hbs');
                        module.templates = module.templates || {};
                        module.templates[templateName] = handlebarsCompile(modFiles[i]);
                    }
            }
        }

        handlebars.registerHelper('module-' + key, moduleHelper.bind(null, module));
    }

    return modules;
}

/**
 * Expands all handlebars templates, generating all content
 * for each page in to a single string.
 * @param {type} [name] [description]
 */
function expandTemplates(site) {
    var page, data, crumbs, modules, name, index;
    var pageModules = {}

    for (var key in site) {
        page = site[key];
        data = page.data;

        // Create a modules collection for each page group
        crumbs = key.split(path.sep);
        crumbs.pop();
        modules = pageModules[crumbs.join(path.sep)] = [];

        if (data) {
            delete page.data;
            page = extend(page, data);
        }

        try {
            page.content = page.template(page);
            
            // Collect all modules together for a page group
            page.modules.forEach(function(module) {
                if (modules.indexOf(module) < 0) {
                    modules.push(module);
                }
            });            
        } catch(err) {
            log('Handlebars', err, 'error');
            page.content = '<span></span>';
        }
    }

    // Collect all modules together and associate it with index.html
    for (var i in pageModules) {
        index = (i.length === 0 ? ['index.html'] : [i, 'index.html']).join(path.sep);
        site[index].modules = pageModules[i];
    }
}

/************
 *  Assets  *
 ************/

/**
 * Replaces all instances of assets:// with the ASSETS_URL
 * environment variable
 * @param {String} content
 */
function replaceAssets(assets) {
    return function(content) {
        return content.replace(/assets:\/\//g, assets);
    };
}

/**
 * Injects a <script src=...> tag in to the given content
 * @param {type} [name] [description]
 */
function injectScriptRef() {
    var comment = '<!-- Inject Scripts -->';
    var tag = '<script src="index.js"></script>';

    return function(content) {
        return content.replace(comment, tag);
    };
}

/**
 * Injects a <link rel=...> tag in to the given content
 * @param {type} [name] [description]
 */
function injectStyleRef() {
    var comment = '<!-- Inject Styles -->';
    var tag = '<link rel="stylesheet" type="text/css" href="main.css">';

    return function(content) {
        return content.replace(comment, tag);
    };
}

/**************
 *  File I/O  *
 **************/

/**
 * Writes HTML to the distribution folder
 * @param {type} [name] [description]
 */
function writeHTML(site, dest, filters, options) {
    var content, filePath, doc;

    for (var page in site) {
        filePath = path.join(dest, page);
        content = site[page].content;

        if (filters) {
            filters.forEach(function(filter) {
                content = filter(content);
            });
        }

        // Add livereload snippet
        doc = cheerio.load(content);
        if (options.lrSnippet) { doc('body').append(lrSnippet); }
        content = doc.html();

        // Write HTML
        mkdirp(path.dirname(filePath), function(filePath, content) {

            // Gzip
            if (options.gzip) {
                zlib.gzip(content, function(err, result) {
                    fs.writeFile(filePath, result, function(err) {
                        if (err) { log('FileIO', err, 'error'); }
                    });
                });
            } else {
                fs.writeFile(filePath, content, function(err) {
                    if (err) { log('FileIO', err, 'error'); }
                });
            }

        }.bind(null, filePath, content));
    }
}

/**
 * Writes all javascript files using browserify
 * @param {type} [name] [description]
 */
function writeScripts(site, src, dest, modules, filters, options) {
    var filePath, b, w;
    var args = Array.prototype.slice(arguments, 0);

    // Add modules
    for (var page in site) {

        // Only write JS for one site
        if (site[page].generated) { continue; }

        b = browserify({
            debug: options.debug,
            cache: {},
            packageCache: {},
            fullPaths: true
        });

        // Add transforms
        b.transform(hbsfy);
        b.transform(debowerify);
        b.transform(installify);
        b.transform(envify);
        
        if (options.debug) { w = watchify(b); }

        // Add modules
        site[page].modules.forEach(function(mod) {
            var module = modules['module-' + mod];
            var name = mod.replace('module-', '');
            var modulePath = path.join(src, 'modules', name);

            if (module.script) {
                b.require(modulePath, {
                    expose: 'module/' + name
                });
            }
        });

        // Add module runner js
        b.add(path.join(__dirname, 'client-runmodules.js'), {
            expose: 'client-runmodules'
        });

        // Add index.js
        if (site[page].script) {
            b.add(path.join(src, 'site', path.dirname(page), 'index.js'));
        }

        // Get path to new index.js
        filePath = path.join(dest, path.dirname(page), 'index.js');

        // Create the bundle
        (options.debug ? w : b).bundle(function(destPath, err, buffer) {
            
            // Catch and report errors
            if (err) {
                log('Browserify', err, 'error');
                return;
            }

            var content = buffer.toString();

            if (filters) {
                filters.forEach(function(filter) {
                    content = filter(content);
                });
            }

            // Uglify the script
            if (options.uglify) {
                content = uglifyjs.minify(content, {fromString: true});
                content = content.code;
            }

            // Write the bundled file
            mkdirp(path.dirname(destPath), function(destPath, content) {

                // Gzip
                if (options.gzip) {
                    zlib.gzip(content, function(err, result) {
                        fs.writeFile(destPath, result, function(err) {
                            if (err) { log('FileIO', err, 'error'); }
                        });
                    });
                } else {
                    fs.writeFile(destPath, content, function(err) {
                        if (err) { log('FileIO', err, 'error'); }
                    });
                }

            }.bind(null, destPath, content));
        }.bind(null, filePath));

        if (options.debug) {
            w.on('update', function(options) {
                writeScripts.apply(null, args);
                triggerLivereload(options.lrPort);
            }.bind(null, options));
        }
    }
}

/**
 * Writes all styles using sass
 * @param {type} [name] [description]
 */
function writeStyles(site, src, dest, modules, filters, options) {
    var combined, modPath, srcPath, destPath, mapPath;
    var includePaths = bourbon.includePaths.concat(neat.includePaths.concat(options.includePaths))
    var postProcess = postcss()
                .use(autoprefixer);

    for (var page in site) {
        
        // Don't compile CSS for generated pages
        if (site[page].generated) { continue; }

        combined = site[page].sass || '';
        srcPath = path.join(src, 'site', path.dirname(site[page].key), 'main.scss');
        destPath = path.join(dest, path.dirname(site[page].key), 'main.css');
        mapPath = path.join(dest, path.dirname(site[page].key), 'main.css.map');

        // Add module @import statements
        site[page].modules.forEach(function(name) {
            modPath = path.join(src, 'modules', name, 'main.scss');
            module = modules['module-' + name];

            combined += '\n';

            if (module.sass) {
                combined += '@import "' + modPath + '";\n';
            }
        });

        sass.render({
            file: srcPath,
            data: combined,
            outFile: destPath,
            outputStyle: options.outputStyle,
            omitSourceMapUrl: !options.sourcemaps,
            sourceComments: options.sourcemaps,
            sourceMap: options.sourcemaps,
            includePaths: includePaths,

            success: function(destPath, mapPath, result) {

                // Write the css file
                mkdirp(path.dirname(destPath), function(destPath, content) {

                    // Pass through optional filters
                    if (filters) {
                        filters.forEach(function(filter) {
                            content = filter(content);
                        });
                    }

                    content = postProcess.process(content).css;

                    // Gzip
                    if (options.gzip) {
                        zlib.gzip(content, function(err, result) {
                            fs.writeFile(destPath, result, function(err) {
                                if (err) { log('FileIO', err, 'error'); }
                            });
                        });
                    } else {
                        fs.writeFile(destPath, content, function(err) {
                            if (err) { log('FileIO', err, 'error'); }
                        });
                    }

                }.bind(null, destPath, result.css));

                // Write the source map
                if (options.sourcemaps) {
                    mkdirp(path.dirname(mapPath), function(mapPath, content) {
                        fs.writeFile(mapPath, content, function(err) {
                            if (err) { log('FileIO', err, 'error'); }
                        });
                    }.bind(null, mapPath, JSON.stringify(result.map)));
                }

            }.bind(null, destPath, mapPath),

            error: function(error) {
                var file = error.file.replace(process.cwd() + '/', '');
                var msg = '"' + error.message + '", ' + file + ', line ' + error.line;
                log('SASS', msg, 'error');
            }
        });
    }
}

/****************
 *  Dev Server  *
 ****************/

/**
 * Creates the static server
 * @param {type} [name] [description]
 */
function createServer(appPath, port) {
    var appServer = new staticServer.Server(appPath);

    http.createServer(function(request, response) {
        request.addListener('end', function() {
            appServer.serve(request, response);
        }).resume();
    }).listen(port);

    log('Server', 'Listening on ' + port);
}

/**
 * 
 * @param {type} [name] [description]
 */
function createWatch(watchPath, callback) {
    var shortPath, ready;
    var watcher = chokidar.watch(watchPath, { persistent: true, ignore: /\.js$/ });
    var filter = ['add', 'change', 'addDir'];

    // Set up watch on source files
    watcher.on('all', function(evt, filePath) {
        if (ready && filter.indexOf(evt) >= 0) {
            shortPath = filePath.replace(process.cwd() + '/', '');
            log('Watch', evt.toUpperCase() + ': ' + shortPath);
            callback();
        }
    });

    watcher.on('ready', function() {
        log('Watch', 'Watching ' + watchPath.replace(process.cwd() + '/', ''));
        ready = true;
    });
}

/**
 *  
 * @param {type} [name] [description]
 */
function triggerLivereload(port) {
    var req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: '/changed?files=*',
        method: 'GET'
    }, function(res) {

        // Nothing happens without a data event
        res.on('data', function() {});

        res.on('error', function(err) {
            console.log(err);
        });
    });

    req.end();
}

/**
 *
 * @param {type} [name] [description]
 */
function startLivereload(dest, port) {
    var server = tinylr();
    var watcher = chokidar.watch(dest, { persistent: true });

    server.listen(port, function() {
        log('LiveReload', 'Listening on port ' + port);
    });

    // Set up watch on source files
    watcher.on('all', function() {
        triggerLivereload(port);
    });
}

/***********
 *  Build  *
 ***********/

module.exports = function build(name) {
    var buildSettings;
    var options = {};

    // Settings
    try {
        buildSettings = require(path.join(process.cwd(), 'builds.json'));
        settings = normalizeSettings(buildSettings);
    } catch (err) {
        console.warn('Could not find builds.json');
    }

    name = name || 'prod';

    // Get desired settings
    settings.forEach(function(setting) {
        if (setting.name === name) {
            options = setting;
        }
    });

    // Expand paths
    options.dest = path.join(process.cwd(), options.dest);
    options.src = path.join(process.cwd(), options.src);
    if (options.assets) {
        options.assets = {
            src: path.join(process.cwd(), options.assets.src),
            dest: path.join(process.cwd(), options.assets.dest)
        };
    }

    // Copy over livereload port to browserify options for watch
    if (options.server && options.browserify) {
        options.browserify.lrPort = options.server.lrPort;
    }

    function runBuild(srcPath, destPath, callback) {
        var site, modules;

        // Set environment variables
        if (options.env) {
            for (var env in options.env) {
                process.env[env] = options.env[env];
            }
        }

        // Read the entire src tree
        readDirFiles.read(srcPath, 'utf8', function(err, files) {

            // Add partials
            registerPartials(files.partials);

            // Process site
            site = processSite(files.site);

            // Registers all module helpers
            modules = registerModules(files.modules);

            // Perform template expansion
            expandTemplates(site);

            // Clean distribution folder
            del(destPath, function() {
                var assets = process.env.ASSETS_URL || '/assets/';

                // Write HTML to debug distribution
                writeHTML(site, destPath, [
                    replaceAssets(assets),
                    injectScriptRef(),
                    injectStyleRef()
                ], options.html);

                // Write JS to debug distribution
                writeScripts(site, srcPath, destPath, modules, [
                    replaceAssets(assets)
                ], options.browserify);

                // Write CSS to debug distribution
                writeStyles(site, srcPath, destPath, modules, [
                    replaceAssets(assets)
                ], options.sass);

                // Copy assets
                if (options.assets) {
                    ncp(options.assets.src, options.assets.dest, function(err) {
                        if (err) { console.error(err); }
                    });
                }

                if (callback) { callback(); }
            });
        });
    }

    // Run build and start servers
    runBuild(options.src, options.dest, function() {
        if (options.server) {
            createWatch(options.src, runBuild.bind(null, options.src, options.dest));    
            startLivereload(options.dest, options.server.lrPort);
            createServer(options.dest, options.server.port);
        }
    });
};
