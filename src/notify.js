'use strict';

var notifier = require('node-notifier');
var path = require('path');

notifier.notify({
    title: 'Error!',
    message: 'Hey!',
    icon: path.join(__dirname, '../bin/sfa3_blanka-1.gif'),
    sound: true,
    wait: true
}, function(err, response) {
    console.log('here');
});
