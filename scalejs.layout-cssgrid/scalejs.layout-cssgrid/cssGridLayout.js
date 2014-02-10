/*global define, require, document, console, window, clearTimeout, setTimeout */
define([
    'scalejs!core',
    './utils.sheetLoader',
    './gridLayout',
    './utils',
    'CSS.supports',
    'scalejs.linq-linqjs'
], function (
    core,
    sheetLoader,
    gridLayout,
    utils,
    css
) {
    'use strict';

    var cssGridRules,
        cssGridSelectors,
        copy = core.object.copy,
        merge = core.object.merge,
        listeners = [];

    function onLayoutDone(callback) {
        core.array.addOne(listeners, callback);

        return function () {
            core.array.removeOne(listeners, callback);
        };
    }

    function notifyLayoutDone(gridElement) {
        listeners.forEach(function (l) {
            l(gridElement);
        });
    }

    /*jslint unparam:true*/
    function doLayout() {
        var gridElements,
            defaultGridProperties = {
                'display': 'grid',
                'grid-rows': 'auto',
                'grid-columns': 'auto'
            },
            defaultGridItemProperties = {
                'grid-row': '1',
                'grid-row-align': 'stretch',
                'grid-row-span': '1',
                'grid-column': '1',
                'grid-column-align': 'stretch',
                'grid-column-span': '1'
            };


        function createOverride(f, propertyNames) {
            var result = {};

            propertyNames
                .forEach(function (p) {
                    var v = f(p);
                    if (v !== undefined) {
                        result[p] = f(p);
                    }
                });

            return result;
        }

        
        function createCssGridOverride(gridElement, propertyNames) {
            // save rules that match the gridElement (parent grid rules only)
            matchedRules = cssGridSelectors
                .filter(function (rule) {
                    return utils.toArray(document.querySelectorAll(rule.selector))
                        .any(function (match) {
                            return gridElement === match;
                        });
                });

            override = createOverride(function (property) {
                var rulesWithProperty = matchedRules
                    // list of rules with itemProperty defined
                    .filter(function (matchedRule) {
                        return (matchedRule.properties[property] !== undefined);
                    });

                // warning about css conflicts
                if (rulesWithProperty.length > 1) {
                    console.log('WARNING: gridElement ', gridElement, ' matched to multiple rules with property "' + property + '".' +
                                'Will use the rule ', rulesWithProperty[0]);
                }

                if (rulesWithProperty.length > 0) {
                    return rulesWithProperty[0].properties[property];
                }
            }, propertyNames);

            return override;
        }

        function createCssGridItemOverride(gridItemElement, propertyNames) {
            // for each grid rule, save it if it matches the element
            matchedItemRules = cssGridRules
                // filter out parent rules (rules present in cssGridSelectors)
                .filter(function (rule) {
                    return !cssGridSelectors.any(function (gridSelector) {
                        return gridSelector === rule;
                    });
                })
                // filter to rules that match gridItemElement
                .filter(function (rule) {
                    var matchedElements = utils.toArray(document.querySelectorAll(rule.selector));
                    return matchedElements.any(function (match) {
                        return gridItemElement === match;
                    });
                });


            override = createOverride(function (itemProperty) {
                var rulesWithProperty = matchedItemRules
                    // list of rules with itemProperty defined
                    .filter(function (matchedItemRule) {
                        return (matchedItemRule.properties[itemProperty] !== undefined);
                    });

                // warning about css conflicts
                if (rulesWithProperty.length > 1) {
                    console.log('WARNING: gridItemElement ' + gridItemElement + ' matched to multiple rules with property "' + itemProperty + '".' +
                                'Will use the rule ', rulesWithProperty[0]);
                }

                if (rulesWithProperty.length > 0) {
                    return rulesWithProperty[0].properties[itemProperty];
                }
            }, propertyNames);

            return override;
        }

        function createDataGridOverride(gridElement, gridPropertyNames) {
            override = createOverride(function (property) {
                if (gridElement.hasAttribute('data-ms-' + property)) {
                    return gridElement.getAttribute('data-ms-' + property);
                }
            }, gridPropertyNames);

            return override;
        }

        function createStyleGridOverride(gridElement) {
            // extract grid properties from inline style, add to gridProperties
            var gridElementStyle = gridElement.getAttribute("style"),
                override = {};

            if (!gridElementStyle) {
                return;
            }

            gridElementStyle.split('; ').forEach(function (styleProperty) {
                var tokens = styleProperty.split(':'),
                    propertyName,
                    propertyValue;

                if (tokens.length === 2) {
                    propertyName = tokens[0].trim();
                    propertyValue = tokens[1].trim();

                    if (propertyName.indexOf('-ms-grid') === 0) {
                        override[propertyName.substring(4)] = propertyValue;
                    }
                }
            });

            // store style attrib values as attibutes of element
            Object.keys(override)
                // for each grid-related property of gridElement
                .forEach(function (propertyKey) {
                    // store value as attribute
                    gridElement.setAttribute('data-ms-' + propertyKey, override[propertyKey]);
                });

            return override;
        }


       // get the list of unique grids (a grid can be matched to more than one style rule therefore distinct)
        gridElements = cssGridSelectors
            .selectMany(function (gridSelector) {
                return document.querySelectorAll(gridSelector.selector);
            })
            .distinct()
            .toArray();

        // for each grid parent, properties from each source (style>data attribute>css<defaults)
        gridElements
            .forEach(function (gridElement) {
                var cssGridProperties,
                    dataGridProperties,
                    styleGridProperties,
                    gridProperties,
                    gridItemData = [],

                cssGridProperties = createCssGridOverride(gridElement, Object.keys(defaultGridProperties));
                dataGridProperties = createDataGridOverride(gridElement, Object.keys(defaultGridProperties));
                styleGridProperties = createStyleGridOverride(gridElement);

                gridProperties = merge(defaultGridProperties, cssGridProperties, dataGridProperties, styleGridProperties);

                // for all children of gridElement, merge properties from each source (style > data attribute > css > defaults)
                utils.toArray(gridElement.children)
                    .forEach(function (gridItemElement) {
                        var cssGridItemProperties,
                            dataGridItemProperties,
                            styleGridItemProperties,
                            gridItemProperties,

                        cssGridItemProperties = createCssGridItemOverride(gridItemElement, Object.keys(defaultGridItemProperties));
                        dataGridItemProperties = createDataGridOverride(gridItemElement, Object.keys(defaultGridItemProperties));
                        styleGridItemProperties = createStyleGridOverride(gridItemElement);

                        gridItemProperties = merge(defaultGridItemProperties, cssGridItemProperties, dataGridItemProperties, styleGridItemProperties);

                        gridItemData.push({
                            element: gridItemElement,
                            details: { properties: gridItemProperties }
                        });
                    });


                gridLayout(gridElement, gridProperties, 'screen', gridItemData);

                notifyLayoutDone(gridElement);
            });

    }


    function parseAllStyles(onLoaded) {
        sheetLoader.loadAllStyleSheets(function (stylesheets) {
            
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
            
            onLoaded();
        })
    }

    function invalidate(reparse) {
        if (!css.supports('display', '-ms-grid')) {
            if (reparse === true) {
                setTimeout(function () {
                    parseAllStyles(function () {
                        doLayout();
                    });
                }, 0);
            } else {
                setTimeout(doLayout, 0);
            }
        }
    }

    return {
        doLayout: doLayout,
        invalidate: invalidate,
        onLayoutDone: onLayoutDone
    };
});
