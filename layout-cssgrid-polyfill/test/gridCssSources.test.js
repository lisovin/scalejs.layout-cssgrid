/*global define,describe,expect,it,afterEach,beforeEach,document,waits */
/*jslint sloppy: true*/
/// <reference path="../Scripts/jasmine.js"/>
define([
    'scalejs!core',
    './gridTestHelper',
    'scalejs.layout-cssgrid',
    'jasmine-html'
], function (
    core
) {
    describe('An element with grid parent and grid item rules in the same css block', function () {
        var grid,
            styleNode,
            safeGetStyle = function (element, name) {
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
            };

        beforeEach(function () {
            var div_grandparent = document.createElement('div'),
                div_parent = document.createElement('div'),
                div_child = document.createElement('div'),
                styleText = '',
                styleTextNode;

            grid = div_grandparent;
            div_grandparent.appendChild(div_parent);
            div_parent.appendChild(div_child);
            styleNode = document.createElement('style');

            div_grandparent.id = 'grandparent';
            div_parent.id = 'parent';
            div_child.id = 'child';

            styleNode.type = "text/css";
            styleNode.id = grid.id + 'style';

            styleText = styleText.concat('#grandparent { \n');
            styleText = styleText.concat('display: -ms-grid; \n');
            styleText = styleText.concat('-ms-grid-rows: 1fr 1fr; \n');
            styleText = styleText.concat('-ms-grid-columns: 1fr 1fr; \n');
            styleText = styleText.concat('width: 200px; \n');
            styleText = styleText.concat('height: 200px; \n');
            styleText = styleText.concat('background: blue; \n');
            styleText = styleText.concat('} \n\n');
            styleText = styleText.concat('#parent { \n');
            styleText = styleText.concat('display: -ms-grid; \n');
            styleText = styleText.concat('-ms-grid-rows: 1fr 1fr; \n');
            styleText = styleText.concat('-ms-grid-columns: 1fr 1fr; \n');
            styleText = styleText.concat('-ms-grid-row: 2; \n');
            styleText = styleText.concat('-ms-grid-column: 2; \n');
            styleText = styleText.concat('background: red; \n');
            styleText = styleText.concat('} \n\n');
            styleText = styleText.concat('#child { \n');
            styleText = styleText.concat('-ms-grid-row: 2; \n');
            styleText = styleText.concat('-ms-grid-column: 2; \n');
            styleText = styleText.concat('background: green; \n');
            styleText = styleText.concat('} \n\n');

            styleTextNode = document.createTextNode(styleText);
            styleNode.appendChild(styleTextNode);
            document.head.appendChild(styleNode);

            document.body.appendChild(grid);

            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            grid.parentNode.removeChild(grid);
            styleNode.parentNode.removeChild(styleNode);
        });

        it('works', function () {

            var parent = document.getElementById('parent');
            expect(safeGetStyle(parent, '-ms-grid-row')).toBe('2');
            expect(safeGetStyle(parent, '-ms-grid-column')).toBe('2');
        });

    });



});