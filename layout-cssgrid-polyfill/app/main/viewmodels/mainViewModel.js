/*global define */
define([
    'sandbox!main',
], function (
    sandbox
) {
    'use strict';

    return function () {
        var observable = sandbox.mvvm.observable,
            text = observable();

        return {
            text: text
        };
    };
});
