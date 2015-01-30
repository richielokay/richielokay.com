#!/usr/bin/env node

'use strict';

/******************
 *  Dependencies  *
 ******************/

var build = require('./build');
var init = require('./init');
var createModule = require('./create-module');
var test = require('./test');

/*************
 *  Exports  *
 *************/

exports.build = build;
exports.test = test;
exports.init = init;
exports.createModule = createModule;
