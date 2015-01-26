'use strict';

/******************
 *  Dependencies  *
 ******************/

var clc = require('cli-color');
var notifier = require('node-notifier');

/***********************
 *  Color Definitions  *
 ***********************/

var groups = {
    Server: clc.blueBright.bold,
    LiveReload: clc.cyanBright.bold,
    Watch: clc.yellow.bold,
    SASS: clc.magenta.bold,
    Handlebars: clc.xterm(208).bold,
    FileIO: clc.green.bold,
    Browserify: clc.xterm(136).bold,
    Time: clc.xterm(11).bold
};

var warn = clc.yellowBright.bold;
var error = clc.redBright.bold;

/*************
 *  Exports  *
 *************/

module.exports = function log(group, message, severity) {
    var notice = ' ';

    if (severity) {
        switch (severity.toLowerCase()) {
            case 'warn':
                notifier.notify({
                    type: 'info',
                    title: group + ' Warning',
                    message: message
                });
                notice = warn('(Warning) ');
                break;
            case 'error':
                notice = error('(Error) ');
                break;
            default:
                break;
        }
    }

    console.log('[' + groups[group](group) + '] ' + notice + message);
};
