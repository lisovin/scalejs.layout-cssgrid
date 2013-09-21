/*global define*/
define([
    'scalejs!core',
    'CSS.supports',
    './scalejs.layout-cssgrid/cssGridLayout',
    'scalejs.reactive'
], function (
    core,
    css,
    cssGridLayout
) {
    'use strict';

    //console.log('is -ms-grid supported? ' + (css.supports('display', '-ms-grid') || false));
    if (!css.supports('display', '-ms-grid')) {
        cssGridLayout.polyfill();
    }

    core.registerExtension({
        layout: {
            cssGrid: cssGridLayout
        }
    });
});

