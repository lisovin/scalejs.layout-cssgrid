/*global define*/
define([
    'CSS.supports',
    './scalejs.layout-cssgrid/cssGridLayout',
    'scalejs.reactive'
], function (
    css,
    polyfill
) {
    'use strict';

    //console.log('is -ms-grid supported? ' + (css.supports('display', '-ms-grid') || false));
    if (!css.supports('display', '-ms-grid')) {
        polyfill();
    }
});

