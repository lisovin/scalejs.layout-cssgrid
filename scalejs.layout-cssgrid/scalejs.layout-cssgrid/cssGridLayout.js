/*global define, require, document, console, window, clearTimeout, setTimeout */
define([
    'scalejs!core',
    './utils.sheetLoader',
    './gridLayout'
], function (
    core,
    sheetLoader,
    gridLayout
) {
    'use strict';

    var cssGridRules,
        cssGridSelectors,
        listeners = [];

    function onLayoutDone(callback) {
        core.array.addOne(listeners, callback);

        return function () {
            core.array.removeOne(listeners, callback);
        };
    }

    function notifyLayoutDone(gridElement, selector) {
        listeners.forEach(function (l) {
            l(gridElement, selector);
        });
    }

    /*jslint unparam:true*/
    function doLayout(element) {
        cssGridSelectors.forEach(function (grid) {
            var selector = grid.selector,
                gridElement,
                properties = grid.properties,
                grid_items,
                gridStyle;

            gridElement = document.getElementById(grid.selector.substring(1));
            if (gridElement === null) { return; }

            gridStyle = gridElement.getAttribute("style");
            if (gridStyle !== null) {
                gridStyle.split('; ').forEach(function (property) {
                    var tokens = property.split(':'),
                        value;

                    if (tokens.length === 2) {
                        property = tokens[0].trim();
                        value = tokens[1].trim();

                        if (property.indexOf('-ms-grid') === 0) {
                            properties[property.substring(4)] = value;
                        }
                    }
                });
            }
            Object.keys(properties).forEach(function (key) {
                gridElement.setAttribute('data-ms-' + key, properties[key]);
            });

            grid_items = cssGridRules
                .filter(function (item) { return item !== grid; })
                .map(function (item) {
                    var grid_item = {},
                        style,
                        gridItemElement;

                    gridItemElement = document.getElementById(item.selector.substring(1));
                    if (gridItemElement === null || gridItemElement.parentNode !== gridElement) {
                        return;
                    }

                    grid_item.element = gridItemElement;
                    grid_item.details = item;

                    style = grid_item.element.getAttribute("style");
                    if (style !== null) {
                        style.split(';').forEach(function (property) {
                            var tokens = property.split(':'),
                                value;

                            if (tokens.length === 2) {
                                property = tokens[0].trim();
                                value = tokens[1].trim();

                                if (property.indexOf('-ms-grid') === 0) {
                                    grid_item.details.properties[property.substring(4)] = value;
                                }
                            }
                        });
                    }

                    Object.keys(grid_item.details.properties).forEach(function (key) {
                        grid_item.element.setAttribute('data-ms-' + key, grid_item.details.properties[key]);
                    });
                    return grid_item;
                })
                .filter(function (item) { return item; });

            gridLayout(gridElement, selector, properties, 'screen', grid_items);

            notifyLayoutDone(gridElement, selector);
        });
    }

    function polyfill() {
        sheetLoader.loadAllStyleSheets(function (stylesheets) {
            if (cssGridRules) { return; }

            cssGridRules = Object.keys(stylesheets)
                .reduce(function (acc, url) {
                    var sheet = stylesheets[url];
                    return acc.concat(sheet.rulelist);
                }, [])
                .filter(function (rule) {
                    var declarations = rule.declarations;

                    if (rule.type !== 'style' || !declarations) { return false; }

                    return Object.keys(declarations).some(function (property) {
                        return property.indexOf('-ms-grid') === 0;
                    });
                })
                .map(function (rule) {
                    var e = {};

                    e.selector = rule.selector;
                    e.media = 'screen';
                    e.properties = {};
                    Object.keys(rule.declarations).forEach(function (property) {
                        var value = rule.declarations[property];
                        if (property.indexOf('-ms-grid') === 0) {
                            e.properties[property.substring(4)] = value;
                        } else if (property === 'display' && value === '-ms-grid') {
                            e.properties.display = 'grid';
                        } else {
                            e.properties[property] = value;
                        }
                    });

                    return e;
                });

            cssGridSelectors = cssGridRules.filter(function (rule) {
                return rule.properties.display === 'grid';
            });

            window.addEventListener('resize', function () {
                doLayout();
            });
        });
    }

    function invalidate() {
        setTimeout(doLayout, 0);
    }

    return {
        polyfill: polyfill,
        invalidate: invalidate,
        onLayoutDone: onLayoutDone
    };
});
