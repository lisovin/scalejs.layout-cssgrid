/*global define, document, window */
define([
    './utils.base',
    './utils.css',
    './utils.profiler'
], function (
    base,
    css,
    profiler
) {
    'use strict';

    return {
        is: base.is,
        defined: base.defined,
        createBoundedWrapper: base.createBoundedWrapper,
        makeUniqueClass: css.makeUniqueClass,
        getCssValue: css.getCssValue,
        addClass: css.addClass,
        embedCss: css.embedCss,
        clearEmbeddedCss: css.clearEmbeddedCss,
        profiler: profiler
    };
});