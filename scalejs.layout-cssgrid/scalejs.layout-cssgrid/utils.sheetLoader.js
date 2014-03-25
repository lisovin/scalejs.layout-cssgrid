/*global define, require, document, console*/
/*jslint regexp: true */
define([
    'cssparser',
    './utils'
], function (
    cssParser,
    utils
) {
    'use strict';

    var toArray = utils.toArray,
        getUrl  = utils.getUrl;

    function loadStyleSheet(url, loadedStyleSheets, onLoaded) {
        if (loadedStyleSheets.hasOwnProperty(url)) {
            return;
        }

        loadedStyleSheets[url] = null;

        getUrl(url, function (stylesheet) {
            var parsed = {
                    rulelist: []
                },
                matches,
                getGridStyles = /\/\*GridLayoutStart\*\/((.|\n|\r)*?)\/\*GridLayoutEnd\*\//gm,
                parsedMatch;

            if (stylesheet.trim().length !== 0) {
                matches = stylesheet.match(getGridStyles);
                if (matches !== undefined && matches !== null) {
                    matches.forEach(function (cssChunk, j) {
                        cssChunk = cssChunk.replace('/*GridLayoutStart*/', '');
                        cssChunk = cssChunk.replace('/*GridLayoutEnd*/', '');
                        if (cssChunk.trim().length !== 0) {

                            parsedMatch = cssParser.parse(cssChunk);
                            parsed.rulelist = parsed.rulelist.concat(parsedMatch.rulelist);
                        }
                    });
                }
            } else {
            }

            loadedStyleSheets[url] = parsed;

            (parsed.imports || []).forEach(function (cssImport) {
                loadStyleSheet(cssImport['import'].replace(/['"]/g, ''), loadedStyleSheets, onLoaded);
            });

            onLoaded();
        });
    }

    function loadAllStyleSheets(onLoaded) {
        var loadedStyleSheets = {},
            styleSheets = toArray(document.styleSheets),
            hrefExists,
            allHtml = document.documentElement.innerHTML,
            removeComments = /<!--(.|\n|\r)*-->/gm,
            getStyles = /<style.*?>((.|\n|\r)*?)<\/style>/gm,
            getGridStyles = /\/\*GridLayoutStart\*\/((.|\n|\r)*?)\/\*GridLayoutEnd\*\//gm,
            headerStyles = [],
            match;

        // collects styles from html

        // clean out comments to remove commented out styles
        allHtml.replace(removeComments, '');

        // extract contents of style tags
        while (true) {
            match = getStyles.exec(allHtml);
            if (!match) {
                break;
            }

            headerStyles.push(match[1]);
        }

        headerStyles.forEach(function (styleText, i) {
            var parsed,
                matches;

            if (styleText.trim().length !== 0) {
                matches = styleText.match(getGridStyles);
                if (matches !== undefined && matches !== null) {
                    matches.forEach(function (cssChunk, j) {
                        cssChunk = cssChunk.replace('/*GridLayoutStart*/', '');
                        cssChunk = cssChunk.replace('/*GridLayoutEnd*/', '');
                        if (cssChunk.trim().length !== 0) {

                            parsed = cssParser.parse(cssChunk);
                            loadedStyleSheets['head' + i + '_' + j] = parsed;
                        }
                    });
                }
            }

        });

        // if no styleSheets have href, call onLoaded
        hrefExists = styleSheets.some(function (s) {
            return s.href;
        });

        if (!hrefExists) {
            onLoaded(loadedStyleSheets);
        }

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
    /* Removed due to conflict with fabric code using 'in' with object prototype.
    Object.getPrototypeOf(cssParser).parseError = function (error, details) {
        console.log(error, details);
    };*/

    return {
        loadAllStyleSheets: loadAllStyleSheets
    };
});