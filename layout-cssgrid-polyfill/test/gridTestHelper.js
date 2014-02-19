/*global define,describe,expect,it*/
/*jslint sloppy: true*/
/// <reference path="../Scripts/jasmine.js"/>
/*jslint browser:true */
define([
], function (
) {
    var colors = [
        '#0000FF',
        '#8A2BE2',
        '#A52A2A',
        '#DEB887',
        '#5F9EA0',
        '#7FFF00',
        '#D2691E',
        '#FF7F50',
        '#6495ED',
        '#008B8B',
        '#006400'
    ];
    function randomizeColors() {
        var i, j, temp;
        for (i = colors.length - 1; i > 0; i -= 1) {
            j = Math.floor(Math.random() * (i + 1));
            temp = colors[i];
            colors[i] = colors[j];
            colors[j] = temp;
        }
    }


    function makeGrid(grid) {
        var parent,
            styleNode,
            styleText;

        randomizeColors();

        parent = document.createElement('div');
        parent.id = grid.id;

        styleNode = document.createElement('style');
        styleNode.type = "text/css";
        styleNode.id = grid.id + 'style';
        
        styleText = '';
        styleText = styleText.concat('#' + grid.id + ' { \n');
        styleText = styleText.concat('display: -ms-grid; \n');
        styleText = styleText.concat('-ms-grid-rows: ' + grid.rows + '; \n');
        styleText = styleText.concat('-ms-grid-columns: ' + grid.columns + '; \n');
        styleText = styleText.concat('width: ' + grid.width + '; \n');
        styleText = styleText.concat('height: ' + grid.height + '; \n');
        styleText = styleText.concat('} \n\n');


        grid.elements.forEach(function (element, i) {
            var child = document.createElement('div'),
                childProps = element.split(' ');

            child.id = childProps[0];

            styleText = styleText.concat('#' + childProps[0] + ' { \n');
            styleText = styleText.concat('background: ' + colors[i % colors.length] + '; \n');
            styleText = styleText.concat('-ms-grid-row: ' + childProps[1] + '; \n');
            styleText = styleText.concat('-ms-grid-column: ' + childProps[2] + '; \n');
            styleText = styleText.concat('-ms-grid-row-span: ' + childProps[3] + '; \n');
            styleText = styleText.concat('-ms-grid-column-span: ' + childProps[4] + '; \n');
            styleText = styleText.concat('} \n\n');

            parent.appendChild(child);
        });


        styleTextNode = document.createTextNode(styleText);
        styleNode.appendChild(styleTextNode);
        document.head.appendChild(styleNode);


        return {
            gridParent: parent,
            gridStyle: styleNode
        };
    }

    function addGrid(gridData) {
        document.body.appendChild(gridData.gridParent);
        document.head.appendChild(gridData.gridStyle);
    }
    function removeGrid(gridData) {
        gridData.gridParent.parentNode.removeChild(gridData.gridParent);
        gridData.gridStyle.parentNode.removeChild(gridData.gridStyle);
    }

    function expectGridElement(element_id, expected) {
        var element,
            style;

        element = document.getElementById(element_id);

        element_rect = element.getBoundingClientRect();
        parent_rect = element.parentElement.getBoundingClientRect();

        if (expected['left'] !== undefined) {
            expect((element_rect.left - parent_rect.left) + 'px').toBe(expected['left']);
        }
        
        if (expected['top'] !== undefined) {
            expect((element_rect.top - parent_rect.top) + 'px').toBe(expected['top']);
        }
        
        if (expected['width'] !== undefined) {
            expect(element_rect.width.toString() + 'px').toBe(expected['width']);
        }

        if (expected['height'] !== undefined) {
            expect(element_rect.height.toString() + 'px').toBe(expected['height']);
        }
    }

    return {
        makeGrid: makeGrid,
        expectGridElement: expectGridElement,
        addGrid: addGrid,
        removeGrid: removeGrid,
    };
});