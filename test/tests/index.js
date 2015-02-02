'use strict';

/******************
 *  Dependencies  *
 ******************/

var apron = require('apron');
var Promise = require('promise');
var validate = require('./validate');

module.exports = function() {
    return apron(process.env.BASE_URL)
        .then(validate);
};
