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

    var cssGridRules = [],
        cssGridSelectors = [],
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
    function doLayout(containerNode) {
        //if nothing is passed, does layout for whole page. Otherwise, only redoes layout for containerNode and children of containerNode

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
            var override,
                matchedRules = cssGridRules
                    .filter(function (rule) {

                        if (gridElement.matches) {
                            return gridElement.matches(rule.selector);
                        } else if (gridElement.mozMatchesSelector) {
                            return gridElement.mozMatchesSelector(rule.selector);
                        } else if (gridElement.webkitMatchesSelector) {
                            return gridElement.webkitMatchesSelector(rule.selector);
                        } else if (gridElement.msMatchesSelector) {
                            return gridElement.msMatchesSelector(rule.selector);
                        } else {
                            return utils.toArray(document.querySelectorAll(rule.selector))
                                .any(function (match) {
                                    return gridElement === match;
                                });
                        }

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
            var override,
                matchedItemRules = cssGridRules
                    /*
                    // filter out parent rules (rules present in cssGridSelectors)
                    .filter(function (rule) {
                        return !cssGridSelectors.any(function (gridSelector) {
                            return gridSelector === rule;
                        });
                    })*/
                    // filter to rules that match gridItemElement
                    .filter(function (rule) {

                        if (gridItemElement.matches) {
                            return gridItemElement.matches(rule.selector);
                        } else if (gridItemElement.mozMatchesSelector) {
                            return gridItemElement.mozMatchesSelector(rule.selector);
                        } else if (gridItemElement.webkitMatchesSelector) {
                            return gridItemElement.webkitMatchesSelector(rule.selector);
                        } else if (gridItemElement.msMatchesSelector) {
                            return gridItemElement.msMatchesSelector(rule.selector);
                        } else {
                            return utils.toArray(document.querySelectorAll(rule.selector))
                                .any(function (match) {
                                    return gridItemElement === match;
                                });
                        }

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

            return override;
        }

        if (cssGridSelectors.length === 0) {
            console.log('Invalidating layout with no rules loaded. Call parseGridStyles(callback) to load styles into the extension.');
        }

       // get the list of unique grids (a grid can be matched to more than one style rule therefore distinct)
        gridElements = cssGridSelectors // if this is undefined, you need to call invalidate with reparse: true for the first time
            .selectMany(function (gridSelector) {
                //if a containerNode
                var container = containerNode || document.body;
                return container.parentNode.querySelectorAll(gridSelector.selector);
            })
            .distinct()
            .toArray();

        // order by depth in document so parents get calculated before children
        function docDepth(e) {
            if (e.parentElement === document.body) {
                return 1;
            } else {
                return 1 + docDepth(e.parentElement);
            }
        }
        gridElements = gridElements.orderBy(docDepth).toArray();

        // for each grid parent, properties from each source (style>data attribute>css<defaults)
        gridElements
            .forEach(function (gridElement) {
                var cssGridProperties,
                    styleGridProperties,
                    gridProperties,
                    gridItemData = [];

                cssGridProperties = createCssGridOverride(gridElement, Object.keys(defaultGridProperties));
                styleGridProperties = createStyleGridOverride(gridElement);

                gridProperties = merge(defaultGridProperties, cssGridProperties, styleGridProperties);

                //copy whatever your final rules are to the style attribute of the grid parent so they can be modified by a splitter
                utils.safeSetStyle(gridElement, '-ms-grid-rows', gridProperties['grid-rows']);
                utils.safeSetStyle(gridElement, '-ms-grid-columns', gridProperties['grid-columns']);


                // for all children of gridElement, merge properties from each source (style > data attribute > css > defaults)
                utils.toArray(gridElement.children)
                    .forEach(function (gridItemElement) {
                        var cssGridItemProperties,
                            styleGridItemProperties,
                            gridItemProperties;

                        cssGridItemProperties = createCssGridItemOverride(gridItemElement, Object.keys(defaultGridItemProperties));
                        styleGridItemProperties = createStyleGridOverride(gridItemElement);

                        gridItemProperties = merge(defaultGridItemProperties, cssGridItemProperties, styleGridItemProperties);

                        //copy whatever your final rules are to the style attribute of the grid parent so they can be modified by a splitter
                        utils.safeSetStyle(gridItemElement, '-ms-grid-row', gridItemProperties['grid-row']);
                        utils.safeSetStyle(gridItemElement, '-ms-grid-column', gridItemProperties['grid-column']);


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
                        var is_ms_prop = property.indexOf('-ms-grid') === 0,
                            is_dis_grid = (property === 'display') && (declarations[property] === '-ms-grid');
                        return is_ms_prop || is_dis_grid;
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
        });
    }

    function invalidate(options) {
        var container;

        if (options && options.container) {
            container = options.container;
        } else {
            container = undefined;
        }

        doLayout(container);
    }
    function parseGridStyles(callback) {
        parseAllStyles(function () {
            callback();
        });
    }

    function dumpParsedRules() {
        console.log("----- GRIDLAYOUT DEBUG ----- \ncssGridRules:\n");
        console.log(cssGridRules);
        console.log("cssGridSelectors:\n");
        console.log(cssGridSelectors);
    }

    return {
        doLayout: doLayout,
        parseGridStyles: parseGridStyles,
        invalidate: invalidate,
        onLayoutDone: onLayoutDone,
        notifyLayoutDone: notifyLayoutDone,
        dumpParsedRules: dumpParsedRules
    };
});
