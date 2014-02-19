/*global define */
/*global window */
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

    var exposed_invalidate;


    //console.log('is -ms-grid supported? ' + (css.supports('display', '-ms-grid') || false));
    if (!css.supports('display', '-ms-grid')) {
        //register resize here
        window.addEventListener('resize', function () {
            cssGridLayout.doLayout();
        });

        exposed_invalidate = cssGridLayout.invalidate;

    } else {
        window.addEventListener('resize', function () {
            cssGridLayout.notifyLayoutDone();
        });

        exposed_invalidate = function () {
            cssGridLayout.notifyLayoutDone();
        };
    }

    core.registerExtension({
        layout: {
            invalidate: exposed_invalidate,
            onLayoutDone: cssGridLayout.onLayoutDone
        }
    });
});

