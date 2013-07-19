/*global define, document, window */
define(function () {
    'use strict';

    function defined(test) {
        return test !== undefined;
    }

    String.prototype.contains = function (str) {
        return this.indexOf(str) !== -1;
    };

    function is(obj, test) {
        var r = false,
            testType = typeof test,
            objType = typeof obj;

        try {
            r = obj instanceof test;
        } catch (e) {
            r = testType === 'string' &&
                    objType === test;
        }

        return r;
    }

    function createBoundedWrapper(method) {
        return function () {
            return method.apply(null, arguments);
        };
    }

    function toArray(list, start, end) {
        if (list === undefined || list === null) {
            return [];
        }

        /*ignore jslint start*/
        var array = [],
            i,
            result;

        for (i = list.length; i--; array[i] = list[i]) { }

        result = Array.prototype.slice.call(array, start, end);

        return result;
        /*ignore jslint end*/
    }

    return {
        is: is,
        defined: defined,
        toArray: toArray,
        createBoundedWrapper: createBoundedWrapper
    };
});