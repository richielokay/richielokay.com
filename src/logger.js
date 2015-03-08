'use strict';

/******************
 *  Dependencies  *
 ******************/

var clc = require('cli-color');
var notifier = require('node-notifier');
var path = require('path');

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
    Time: clc.xterm(11).bold,
    Assets: clc.xterm(105).bold,
    Blanca: clc.green.bold,
    Gzip: clc.xterm(7).bold,
    Resources: clc.xterm(157).bold,
    Test: clc.greenBright.bold,
    Git: clc.xterm(203).bold
};

var warn = clc.yellowBright.bold;
var error = clc.redBright.bold;

/*************
 *  Exports  *
 *************/

module.exports = function log(group, message, severity, notify) {
    var notice = ' ';

    if (severity) {
        switch (severity.toLowerCase()) {
            case 'warn':
                notice = warn('(Warning) ');
                break;
            case 'error':
                notice = error('(Error) ');
                notifier.notify({
                    type: 'error',
                    title: group,
                    message: 'Error - See the terminal for more info...'
                });
                break;
            default:
                break;
        }
    }

    if (notify) {
        notifier.notify({
            type: 'info',
            title: group,
            message: message
        });
    }

    group = group || 'Blanca';

    // Conditionally apply colors
    if (process.env.COLORS === false) {
    } else {
        group = groups[group](group);
    }

    console.log('[' + (group) + '] ' + notice + message);
};
