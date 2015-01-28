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
    Blanka: clc.green.bold,
    Gzip: clc.xterm(7).bold
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
                break;
            default:
                break;
        }
    }

    if (notify) {
        notifier.notify({
            type: 'info',
            title: group,
            message: message,
            icon: path.join(__dirname, '../bin/sfa3_blanka-1.gif')
        });
    }

    group = group || 'Blanka';

    // Conditionally apply colors
    if (process.env.COLORS === false) {
    } else {
        group = groups[group](group);
    }

    console.log('[' + (group) + '] ' + notice + message);
};
