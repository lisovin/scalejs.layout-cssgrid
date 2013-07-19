/*global define, require, document, console */
define([
    'scalejs!core',
    './utils.sheetLoader',
    './gridLayout'
], function (
    core,
    utils,
    gridLayout
) {
    'use strict';

    var cssGridRules,
        cssGridSelectors;

    function doLayout() {
        cssGridSelectors.forEach(function (grid) {
            var selector = grid.selector,
                element,
                properties = grid.properties,
                grid_items;

            element = document.getElementById(grid.selector.substring(1));
            if (element === null) { return; }

            grid_items = cssGridRules
                .filter(function (item) { return item !== grid; })
                .map(function (item) {
                    var grid_item = {};
                    grid_item.details = item;
                    grid_item.element = document.getElementById(item.selector.substring(1));

                    return grid_item;
                });

            //console.log(selector, properties, grid_items);

            gridLayout(element, selector, properties, 'screen', grid_items);
        });
    }

    return function polyfill() {
        var messageBus = core.reactive.messageBus;

        utils.loadAllStyleSheets(function (stylesheets) {
            //console.log('-->all stylesheets loaded', stylesheets);
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

            //console.log('css grid rule', gridRules);

            cssGridSelectors = cssGridRules.filter(function (rule) {
                return rule.properties.display === 'grid';
            });
            //console.log('css grids', grids);

            doLayout();

            messageBus.receive('css-grid-layout', function () {
                console.log('--->css grid layout: doLayout');
                doLayout();
            });
        });
    };
});
