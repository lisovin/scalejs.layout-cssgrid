/*global define */
/*global window */
define([
    'scalejs!core',
    './scalejs.layout-cssgrid/cssGridLayout',
    'CSS.supports',
    './scalejs.layout-cssgrid/utils'
], function (
    core,
    cssGridLayout,
    css,
    utils
) {
    'use strict';

    var exposed_invalidate,
        exposed_parseGridStyles;


    //console.log('is -ms-grid supported? ' + (css.supports('display', '-ms-grid') || false));
    if (!css.supports('display', '-ms-grid')) {
        //register resize here
        window.addEventListener('resize', function () {
            setTimeout(function () {
                cssGridLayout.doLayout();
            }, 0);

        });

        exposed_invalidate = cssGridLayout.invalidate;
        exposed_parseGridStyles = cssGridLayout.parseGridStyles;

    } else {
        window.addEventListener('resize', function () {
            cssGridLayout.notifyLayoutDone();
        });

        exposed_invalidate = function () {
            cssGridLayout.notifyLayoutDone();
        };
        exposed_parseGridStyles = function (callback) {
            callback();
        }
    }

    core.registerExtension({
        layout: {
            invalidate: exposed_invalidate,
            parseGridStyles: exposed_parseGridStyles,
            onLayoutDone: cssGridLayout.onLayoutDone,
            utils: {
                safeSetStyle: utils.safeSetStyle,
                safeGetStyle: utils.safeGetStyle,
                getTrackSize: utils.getTrackSize,
                getCalculatedTrackSize: utils.getCalculatedTrackSize,
                setTrackSize: utils.setTrackSize
            }
        }
    });
});

