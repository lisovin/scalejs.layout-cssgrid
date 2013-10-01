/*global define*/
define([
    'scalejs!core',
    'CSS.supports',
    './scalejs.layout-cssgrid/cssGridLayout'
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
            invalidate: cssGridLayout.invalidate,
            onLayoutDone: cssGridLayout.onLayoutDone
        }
    });
});

