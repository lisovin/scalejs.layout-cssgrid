/*global define*/
define([
    'scalejs!core',
    './scalejs.layout-cssgrid/cssGridLayout',
    'CSS.supports'
], function (
    core,
    cssGridLayout,
    css
) {
    'use strict';

    //console.log('is -ms-grid supported? ' + (css.supports('display', '-ms-grid') || false));
    if (!css.supports('display', '-ms-grid')) {
        //register resize here
        window.addEventListener('resize', function () {
            cssGridLayout.doLayout();
        });

    }

    core.registerExtension({
        layout: {
            invalidate: cssGridLayout.invalidate,
            onLayoutDone: cssGridLayout.onLayoutDone
        }
    });
});

