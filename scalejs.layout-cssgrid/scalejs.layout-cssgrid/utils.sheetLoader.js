/*global define, require, document, window, ActiveXObject, XMLHttpRequest*/
define([
    './utils.base',
    'cssParser',
    'domReady'
], function (
    base,
    cssParser
) {
    'use strict';

    var toArray = base.toArray;

    function load(url, callback) {
        function getRequest() {
            if (window.ActiveXObject) {
                return new ActiveXObject('Microsoft.XMLHTTP');
            }

            if (window.XMLHttpRequest) {
                return new XMLHttpRequest();
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

    function loadStyleSheet(url, loadedStyleSheets, onLoaded) {
        if (loadedStyleSheets.hasOwnProperty(url)) {
            return;
        }

        loadedStyleSheets[url] = null;

        load(url, function (stylesheet) {
            var parsed = cssParser.parse(stylesheet);

            loadedStyleSheets[url] = parsed;

            (parsed.imports || []).forEach(function (cssImport) {
                loadStyleSheet(cssImport['import'], loadedStyleSheets, onLoaded);
            });

            onLoaded();
        });
    }

    function loadAllStyleSheets(onLoaded) {
        var loadedStyleSheets = {};

        toArray(document.styleSheets)
            .forEach(function (sheet) {
                if (sheet.href) {
                    loadStyleSheet(sheet.href, loadedStyleSheets, function () {
                        //console.log(sheet.href, loadedStyleSheets);
                        var url;
                        for (url in loadedStyleSheets) {
                            if (loadedStyleSheets.hasOwnProperty(url)) {
                                if (loadedStyleSheets[url] === null) {
                                    return;
                                }
                            }
                        }

                        onLoaded(loadedStyleSheets);
                    });
                }
            });
    }

    return {
        loadAllStyleSheets: loadAllStyleSheets
    };
});