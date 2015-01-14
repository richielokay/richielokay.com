'use strict';

/******************
 *  Dependencies  *
 ******************/

var clc = require('cli-color');

/***********************
 *  Color Definitions  *
 ***********************/

var groups = {
    Server: clc.blueBright.bold,
    LiveReload: clc.cyanBright.bold,
    Watch: clc.green.bold,
    SASS: clc.magenta.bold,
    Handlebars: clc.xterm(208).bold
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
