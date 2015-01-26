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
