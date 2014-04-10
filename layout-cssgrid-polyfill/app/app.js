/*global require,window */
require([
    'scalejs!core',
    'domReady',
    'scalejs.layout-cssgrid'
], function (
    core,
    domReady
) {
    'use strict';

    window.layout = {
        invalidate: core.layout.invalidate,
        onLayoutDone: core.layout.onLayoutDone
    };

    domReady(function () {
        core.layout.parseGridStyles(function () {
            core.layout.invalidate({
                reparse: true
            });
        })
    });
});

