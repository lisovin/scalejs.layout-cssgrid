/*global define, document, window, console */
define(function () {
    'use strict';

    function safeSetStyle(element, name, value) {
        //Set values of style attribute without browser checking if they are supported
        var currentStyle,
            styleObj = {},
            result;

        if (element.hasAttribute('style')) {
            currentStyle = element.getAttribute('style');
        } else {
            currentStyle = '';
        }

        currentStyle.split(';').forEach(function (styleProperty) {
            var tokens = styleProperty.split(':'),
                propertyName,
                propertyValue;

            if (tokens.length === 2) {
                propertyName = tokens[0].trim();
                propertyValue = tokens[1].trim();

                styleObj[propertyName] = propertyValue;
            }
        });

        styleObj[name] = value;

        result = Object.keys(styleObj).select(function (key) {
            return key + ': ' + styleObj[key];
        }).toArray().join('; ');

        element.setAttribute('style', result);
    }
    function safeGetStyle(element, name) {
        //Get values of style attribute without browser checking if they are supported
        var currentStyle,
            styleObj = {};

        if (element.hasAttribute('style')) {
            currentStyle = element.getAttribute('style');
        } else {
            currentStyle = '';
        }

        currentStyle.split(';').forEach(function (styleProperty) {
            var tokens = styleProperty.split(':'),
                propertyName,
                propertyValue;

            if (tokens.length === 2) {
                propertyName = tokens[0].trim();
                propertyValue = tokens[1].trim();

                styleObj[propertyName] = propertyValue;
            }
        });

        return styleObj[name];
    }

    function getTrackSize(element, rowOrColumn, gridIndex) {
        //gridIndex is 1-based counting
        var trackRule = safeGetStyle(element, '-ms-grid-' + rowOrColumn + 's'),
            trackSizes = trackRule.split(' ');

        if (trackSizes.length <= gridIndex - 1) {
            return ('grid does not have that many ' + rowOrColumn + 's');
        } else {
            return trackSizes[gridIndex - 1];
        }
    }
    function getCalculatedTrackSize(element, rowOrColumn, gridIndex) {
        //gridIndex is 1-based counting
        var calculatedTracks = element.attributes['data-grid-calculated-' + rowOrColumn + 's'].textContent,
            calculatedSizes = calculatedTracks.split(' ');

        if (calculatedSizes.length <= gridIndex - 1) {
            return ('grid does not have that many ' + rowOrColumn + 's');
        } else {
            return calculatedSizes[gridIndex - 1];
        }
    }
    function setTrackSize(element, rowOrColumn, gridIndex, size) {
        var trackRule = safeGetStyle(element, '-ms-grid-' + rowOrColumn + 's'),
            trackSizes = trackRule.split(' ');
        
        if (trackSizes.length <= gridIndex - 1) {
            return ('grid does not have a ' + rowOrColumn + ' with that index');
        } else {
            trackSizes[gridIndex - 1] = size;
        }

        safeSetStyle(element, '-ms-grid-' + rowOrColumn + 's', trackSizes.join(' '));
    }


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
        getUrl: getUrl,
        safeSetStyle: safeSetStyle,
        safeGetStyle: safeGetStyle,
        getTrackSize: getTrackSize,
        getCalculatedTrackSize: getCalculatedTrackSize, 
        setTrackSize: setTrackSize
    };
});