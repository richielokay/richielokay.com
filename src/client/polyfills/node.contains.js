'use strict';

if (!Node.prototype.contains && Node.prototype.compareDocumentPosition) {
    Node.prototype.contains = function(node) {
        return !!(this.compareDocumentPosition(node) & 16); // jshint ignore:line
    };
}
