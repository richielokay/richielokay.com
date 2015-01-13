'use strict';

window.addEventListener('load', function runModules() {
    var mod;
    var moduleName;
    var modules = window.document.querySelectorAll('[data-module]');

    // Run module scripts against each module element
    for (var i=0, len=modules.length; i<len; i+=1) {
        mod = modules[i];
        moduleName = mod.getAttribute('data-module');
        modules[i].removeAttribute('data-module');
        try {
            require(moduleName)(mod);
        } catch(err) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(err);
            }
        }
    }
});
