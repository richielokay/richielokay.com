# blanka

Blanka builds your static web sites. You write Handlebars, SASS, and Browserified JavaScript. Blanka builds compliant front-end code ready for distribution on a static host such as AWS S3+CloudFront.

Additional features:

* Configurable build targets (development, production, etc.)
* Code minification
* Descriptive debug logger with notifications
* Includes common HTML5 polyfills (HTML5-shiv, EventListener, classList, querySelector, bind)
* Global asset resolution using ```assets://```
* Module injection using Handlebars and ```{{ module-* }}``` helpers
* Templated content-driven generation of pages for blogs, articles, etc.
* Static web server with Livereload
* Pre-fetches data from external resources over HTTP

# Install

```$ npm install blanka -g```

# Quick Start

From an empty project folder, run 

```$ blanka init```

Then run

```$ blanka debug```


Assuming the server and Livereload ports are available, you should see:

```
[Server]  Listening on 8080
[LiveReload]  Listening on port 35729
[Watch]  Watching app
```

You can navigate to the page by visiting ```http://localhost:8080``` in your browser. Begin editing files under the ```app/site``` folder. All file changes will trigger Livereload to refresh your browser.

```Ctrl-C``` will exit the process. To run a production build, run

```$ blanka build prod```

# Project Scaffolding

## $ blanka init [name]

To create a new project, create a new project folder, and from this folder run:

```$ blanka init```

By default, Blanka will use the name of the folder as the name of the project. If you would like to override this, run

```$ blanka init [name]```

A new project is scaffolded containing several files and a folder structure for a basic website.

### .dotfiles

The following .dotfiles are added to the root of the project:

* .editorconfig
* .gitignore
* .jshintrc

### Package Management

Both npm and bower package management systems are used. The following files are added to the project:

* package.json
* bower.json

### builds.json

The ```builds.json``` file is the primary configuration file for blanka. It describes the various build outputs and their respective settings. For example, it's possible to describe unique debug and production builds.

### resources.json

The ```resources.json``` file contains settings for pre-fetching external resources.

### app/

The app folder contains all the source files for the project. All development should occur within this folder.

#### app/site

This folder contains the top-level index page and its related assets. This includes:

* index.hbs
* main.scss
* index.js

Additionally, there may be sub-folders within the app/site folder. These contain their own index.hbs, main.scss, and index.js files.

These files are compiled directly to the corresponding ```dist/``` folder.

##### pages.json

It's possible to render several pages at once using a ```pages.json``` file and additional template files. The ```pages.json``` file may be placed in any folder under ```site```.

#### app/style

All *.scss files in the ```style/``` folder are made available to SASS and are accessible using ```@import "name";```.

#### app/scripts

#### app/partials

All *.hbs files in the ```partials/``` folder are made available to Handlebars and are accessible using ```{{> name }}```.

#### app/modules

Modules are smaller components that may be included and re-used throughout the site. Examples include sub-sections, controls, forms and form fields. Modules may contain:

* index.js
* index.hbs
* main.scss
* defaults.json

### assets/

Assets contain additional resources such as images or video. In most debug scenarios, assets are served up via the local static server. They are accessible, for example, at:

``` http://localhost:8080/assets ```

In production environments, any number of means could be used to serve up assets (CDN, etc.)

# Running Builds

## $ blanka build [name]

Blanka is capable of running several builds. Each build can be configured, allowing for unique debug and production build targets.

Each build is configured using ```builds.json```. The default file is as follows:

```json
[
    {
        "name": "debug",
        "src": "app",
        "dest": "dist/debug",
        "env": {
            "NODE_ENV": "development",
            "ASSETS_URL": "/assets/"
        },
        "scripts": {
            "debug": true,
            "uglify": false
        },
        "styles": {
            "sourcemaps": true,
            "outputStyle": "nested",
            "includePaths": ["app/style"]
        },
        "html": {
            "lrSnippet": true,
            "gzip": false
        },
        "assets": {
            "src": "assets",
            "dest": "dist/debug/assets"
        },
        "server": {
            "port": 8080,
            "lrPort": 35729
        }
    },
    {
        "name": "prod",
        "src": "app",
        "dest": "dist/prod",
        "env": {
            "NODE_ENV": "production",
            "ASSETS_URL": "/assets/"
        },
        "scripts": {
            "uglify": true
        },
        "styles": {
            "outputStyle": "compressed",
            "includePaths": ["app/style"]
        }
    }
]
```

This file describes two builds, "debug" and "prod". These can each be run using

```$ blanka build debug```

and

```$ blanka build prod```

Each aspect of the build can be configured including SASS compilation, HTML generation, and browserified javascript. Environment variables are set and are accessible within the app code using ```process.env.ENV_VAR```. Optional static debug servers may also be configured, enabling file watching and LiveReload.

## Asset Resolution

In all source files, assets may be referred to using the ```assets://``` convention. This makes it possible to refer to assets in one way in your source. On build, ```assets://``` is replace with the URL specified by the ```ASSETS_URL``` environment variable.

## Versioning

Versioning is handled by Blanka to facilitate version consistency and cache busting. This is useful for deploying to a global edge cache network such as AWS CloudFront.

Versions are handled using the first 8 characters of the git hash. Currently, only a versioned prefix is supported. In the builds.json file, set ```versioning: true```. When building js or css files, they will be placed inside a versioned parent folder. Additionally, all index.html files will refer to the versioned path. The distribution output may look like this:

```
scripts
  |- fj439cfj
     |- page2
        |- index.js
     |- index.js
styles
  |- fj439cfj
     |- page2
        |- main.css
     |- main.css
page2
  |- index.html
index.html

```

If using an edge cache network, it's recommended to set the TTL of the js and css resources to be very high. For example, ```Cache-Control: max-age=31536000``` will cache the versioned resources for as long as a year.

Alternatively, all index.html files should have a very short TTL or not be cached at all. For example, ```Cache-Control: max-age=no-cache``` or ```Cache-Control: max-age=60``` to specify a 1 minute TTL.

## Building HTML

```site/**/*.hbs --> dist/[build_name]/**/*.html```

All html source files are written as Handlebars templates. In the ```site/``` folder, an index.hbs file will compile to an index.html file in the ```dist/[build_name]``` folder. This process is recursive, so all sub-folders and their corresponding index.hbs files will also be compiled to index.html files.

This phase of building is called "template expansion". Partials ```{{> partial }}``` from the ```app/partials``` folder are injected along with modules ```{{ module-* }}``` from ```app/modules```. As these templates are expanded, page-by-page dependencies (style and scripts) are collected and used in the following build steps.

Note that all templating occurs during build time. Handlebars is not included in the client code unless client-side templating is required.

### pages.json

Using a pages.json file and additional templates, you can generate more than an index.html file in each destination folder. For example, if you had a ```templateA.hbs``` file, you might create the following pages.json file:

```json
{
    "templateA": {
        "pageA": {
            "title": "Page A",
            "date": "01/20/15"
        },
        "pageB": {
            "title": "Page B",
            "date": "01/21/15"
        }
    }
}
```

The above data would output two files, ```pageA.html``` and ```pageB.html```. Each of these are templated using their respective data. Note that the ```title``` and ```date``` fields are only examples. You may incorporate any data you choose.

#### Settings

* **lrSnippet** *[boolean]* Whether to inject the livereload snippet in to each HTML file.

## Building CSS

```site/**/main.scss --> dist/[build_name]/**/main.css```

SASS compilation recursively compiles scss to css. All .scss files located in ```app/styles``` may be imported using the ```@import "name";``` directive in main.scss files. For now, Bourbon and Neat are automatically included and may be imported using ```@import "bourbon";``` and ```@import "neat";```.

In addition to styles described in the ```site/``` folder, dependencies on modular scss files from the ```modules/``` folder are automatically imported.

#### Settings

* **sourcemaps** *[boolean]* Whether to generate sourcemap files ```main.css.map``` for debugging CSS.
* **outputStyle** *[string] nested, compressed* Whether to generated verbose, nested CSS or compressed / minified CSS.
* **includePaths** *[array]* A list of all include paths to make available to SASS using ```@import```.

## Building JavaScript

```site/**/index.js --> dist/[build_name]/**/index.js```

All source JavaScript files are written in the Node.JS style and are compiled for the browser using Browserify. This allows for dependency management using npm and bower, whose modules may be require'd using ```var package = require('package_name');```.

Additionally, it's not necessary to encapsulate scripts in ```(function() {})();``` closures. This is automatically handled using Browserify.

In addition to scripts located under the ```site/``` folder, dependencies on modular script files from the ```modules/``` folder are automatically imported.

#### Settings

* **debug** *[boolean]* Whether to include source maps for debug purposes
* **uglify** *[boolean]* Whether to uglify the output

## Including Assets

Assets may be included in each build. They are copied from the source to the destination paths. 

#### Settings

* **src** *[string]* The source folder containing assets
* **dest** *[string]* The destination folder to place assets

## Debug Server

A static debug server may be started for a build. It servers up all assets in the target build folder. If a server is configured for a build, live debug messages are sent to stdout.

#### Settings

* **port** *[integer]* The localhost web server port, defaults to ```8080```
* **lrPort** *[integer]* The livereload port, defaults to ```35729```

## Gzip

All destination files including HTML, JS, and CSS may be gzipped. Depending on the nature of the host, different gzip outputs may be required. By default, settings ```"gzip": true``` will result in gzipped files that retain their extensions (.css, .js, etc.) It's also possible to configure gzip as follows:

```
"gzip": {
    "extension": true,
    "both": true
}
```

Setting ```"extension": true``` results in the addition of a .gz extension to all generated gzip files. Setting ```"both": true``` results in both the compressed (.gz) and uncompressed files in the output.

# Modules

Blanka facilitates a "just enough framework" architecture based on modules. Browserify allows for the inclusion of dependencies from both the npm and bower package management ecosystems. Additionally, web modules from within the project's ```app/modules``` folder are automatically made available.

To create a new module, run

```$ blanka module [name]```

from the project folder. A new module will be scaffolded, including the following files:

* **index.hbs** Contains the module's markup as a single-parent DOM tree
* **defaults.json** The default data to pass in to the module's template
* **main.scss** Style to compile for pages including this module
* **index.js** The code to run against the module's DOM element

Here is a sample module that generates a button, located in  ```app/modules/myButton```:

**index.hbs**
```html
<button class="my-button">{{ text }}</button>
```

**defaults.json**
```json
{ "text": "Click Me!" }
```

**main.scss**
```sass
.my-button {
    font-family: "Comic Sans MS";
}
```

**index.js**
```javascript
'use strict';

module.exports = function(element) { // <-- The top-level element, <button>
    element.addEventListener('click', function() {
        console.log('Don\'t do that!');
    }, false);  
};
```

Using this module's Handlebars helper, it can be included elsewhere in the document using:

```html
<html>...<body>...
{{ module-myButton }}
...</body></html>
```

Which would result in:

```html
<html>...<body>...
<button class="my-button">Click Me!</button>
...</body></html>
```

You can override any data passed in to the template locally as follows:

```html
{{ module-myButton text="Don't Click Me!" }}
```

Which would result in:

```html
<html>...<body>...
<button class="my-button">Don't Click Me!</button>
...</body></html>
```

If you would like to use a template other than ```index.hbs```, for example ```button2.hbs```, you may override it as follows:

```html
{{ module-myButton template="button2" }}
```

## Module Execution

It's helpful to understand how modules are loaded and executed on the client. Unlike many frameworks, Blanka renders the DOM at build time. All modular HTML and partials are already in the document prior to being sent to the client. If no dynamic client-side template rendering is necessary, the Handlebars run-time is absent from the front-end build.

Modules are made available to the application build and are exposed as ```modules/<name>```. Modular code may be imported using:

```javascript
var moduleScript = require('modules/<name>');
```

When a module's HTML is injected during build time, it is given a ```data-module``` attribute. Once the client document has loaded, the following code is run:

```javascript
'use strict';

window.addEventListener('load', function runModules() {
    var mod;
    var moduleName;
    var modules = window.document.querySelectorAll('[data-module]');
    var docElement = document.documentElement;

    // Remove no-js class
    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2');

    // Run module scripts against each module element
    for (var i=0, len=modules.length; i<len; i+=1) {
        mod = modules[i];
        moduleName = mod.getAttribute('data-module');
        modules[i].removeAttribute('data-module');
        require('modules/' + moduleName)(mod);
    }
});
```

## Resource Loading

It's often useful to pull down content from an external resource on the web prior to building your page. For example, the content of blog posts and news articles that do not change frequently may be stored and served statically. Or, initial data may be pre-populated and updated as-needed on the client. External resources may be described in a ```resources.json``` file in the root of your project. The format is as follows:

```json
{
    "weather": {
        "loader": "./resources/weather-loader.js"
    },
    "blogs": {
        "src": "https://api.bubs-blog.info"
    }
}
```

### Automatic loading using "src"

You may load data using both http and https using the "src" property. Blanka uses node's native http modules to populate the build context.

### Custom loading using "loader"

There may be more complex needs when loading data. For example, data may be collected from several resources, collated, and formatted according to the needs of the application.

A custom loader is a node module that returns a promise that resolves to a parsed JavaScript object. A simple example is as follows:

```javascript
'use strict';

// Dependencies
var https = require('https');
var Promise = require('promise');

// Vars
var src = 'https://path/to/api';

// Exports
module.exports = new Promise(function(resolve, reject) {
    var json = '';

    https.get(src, function(res) {
        res.on('data', function(data) {
            json += data.toString();
        });

        res.on('end', function() {
            var data = JSON.parse(json);
            resolve(data);
        });

        res.on('error', function(err) {
            reject(err);
        });
    });
});

```

### Using external resources

You can use this data as the context for your module templates as follows:

```html
{{ module-articles data="blogs" }}
```

## Testing

### blanka test [name] [filename]

Blanka comes with basic support for running tests. When running

```$ blanka test [name]```

a static server is created pointing to the specified build output in the ```dist/``` folder. A top-level test runner, typically ```tests/index.js``` is run unless a filename is specified. For example, to run only ```tests/functional.js``` on the production build:

```$ blanka test prod functional```

### How Tests Work

#### Test Runner

Tests should be run from a top-level runner. This runner calls additional step files that may perform any number of test steps. The runner instantiates the test environment prior to running steps. The following is a sample runner that runs a single validation step:

```javascript
var apron = require('apron');
var Promise = require('promise');
var validate = require('./validate');

module.exports = function() {
    return apron(process.env.BASE_URL)
        .then(validate);
};
```

This runner uses apron, which sets up an environment for functional front-end testing. Apron is a very small wrapper around a [jsdom](https://github.com/tmpvar/jsdom) instance. The target DOM is rendered and scripts are processed. If runtime errors are thrown, the test automatically fails. Otherwise, the window object is passed to consecutive test steps.

Test step files export a function that accepts a window object as a parameter and returns a promise. Within this function, other test frameworks may be used for unit testing, as long as they are ```require()```-able in node.js. It's easiest to use node's [assert module](http://nodejs.org/api/assert.html). The following is the ```validate.js``` step from above:

```javascript
var Promise = require('promise');
var assert = require('assert');

module.exports = function(window) {

    // Setup
    var testElement = window.document.querySelector('.test');

    // Tests
    assert.equal(testElement.innerHTML, 'Test!');
    // more tests...

    return Promise.resolve(window);
};
```




