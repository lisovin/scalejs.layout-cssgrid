/*global define, document, window, console */
define(function () {
    'use strict';

    function camelize(str) {
        var regex = /(-[a-z])/g,
            func = function (bit) {
                return bit.toUpperCase().replace('-', '');
            };

        return typeof str === 'string'
            ? str.toLowerCase().replace(regex, func)
            : str;
    }

    function getCssValue(element, property) {
        if (element.currentStyle) {
            return element.currentStyle[camelize(property)];
        }

        if (window.getComputedStyle) {
            return window.getComputedStyle(element, null).getPropertyValue(property);
        }
    }

    function getMeasureValue(element, property) {
        var value = getCssValue(element, property);
        value = parseFloat(value, 10);

        return isNaN(value) ? 0 : Math.ceil(value);
    }

    function toArray(list, start, end) {
        /*ignore jslint start*/
        var array = [],
            i,
            result;

        for (i = list.length; i--; array[i] = list[i]) { }

        result = Array.prototype.slice.call(array, start, end);

        return result;
        /*ignore jslint end*/
    }

    function getUrl(url, callback) {
        function getRequest() {
            if (window.ActiveXObject) {
                return new window.ActiveXObject('Microsoft.XMLHTTP');
            }

            if (window.XMLHttpRequest) {
                return new window.XMLHttpRequest();
            }
        }

        var request = getRequest();
        if (request) {
            request.onreadystatechange = function () {
                if (request.readyState === 4) {
                    callback(request.responseText);
                }
            };
        }
        request.open("GET", url, true);
        request.send();
    }

    return {
        camelize: camelize,
        getCssValue: getCssValue,
        getMeasureValue: getMeasureValue,
        toArray: toArray,
        getUrl: getUrl
    };
});