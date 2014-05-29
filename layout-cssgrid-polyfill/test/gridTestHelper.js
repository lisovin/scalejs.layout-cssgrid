/*global define,describe,expect,it*/
/*jslint sloppy: true*/
/// <reference path="../Scripts/jasmine.js"/>
/*jslint browser:true */
define([
], function (
) {
    function expectGridElement(element_id, expected) {
        var element,
            style;

        element = document.getElementById(element_id);
        console.log(element);

        element_rect = element.getBoundingClientRect();
        parent_rect = element.parentElement.getBoundingClientRect();

        if (expected.left !== undefined) {
            expect((element_rect.left - parent_rect.left) + 'px').toBe(expected.left);
        }
        
        if (expected.top !== undefined) {
            expect((element_rect.top - parent_rect.top) + 'px').toBe(expected.top);
        }
        
        if (expected.width !== undefined) {
            expect(element_rect.width.toString() + 'px').toBe(expected.width);
        }

        if (expected.height !== undefined) {
            expect(element_rect.height.toString() + 'px').toBe(expected.height);
        }
    }

    /*
    * Gets the properties of the element with given element_id.
    * @param element_id -- id of the target element
    * @param parsedRuleDump -- cssGridRules from dumpParsedStyles
    * @author Jeremy
    * Preconditions: element_id is the valid id of an element,
    *                parsedRuleDump contains the cssGridRules from
    *                dumpParsedStyles
    * Postconditions: properties of the element are returned
    */
    function getParsedProperties(element_id, parsedRuleDump) {
        var i, j;
        
        for (i in parsedRuleDump) {
            if (parsedRuleDump[i].selector.indexOf(element_id) > -1) {
                return parsedRuleDump[i].properties;
            }
        }
    }


    
    /*
    * Goes finds the level-th parent of the element to calculate the coordinates/dimensions
    */
    function expectInnerGridElement(element_id, level, expected) {
        var element,
            element_rect,
            ancestor,
            ancestor_rect,
            style,
            i;

        element = document.getElementById(element_id);
        ancestor = element;
        console.log(element);

        element_rect = element.getBoundingClientRect();

        for (i = 0; i < level; i++) {
            ancestor = ancestor.parentElement;
        }

        ancestor_rect = ancestor.getBoundingClientRect();

        if (expected['left'] !== undefined) {
            expect((element_rect.left - ancestor_rect.left) + 'px').toBe(expected['left']);
        }

        if (expected['top'] !== undefined) {
            expect((element_rect.top - ancestor_rect.top) + 'px').toBe(expected['top']);
        }

        if (expected['width'] !== undefined) {
            expect(element_rect.width.toString() + 'px').toBe(expected['width']);
        }

        if (expected['height'] !== undefined) {
            expect(element_rect.height.toString() + 'px').toBe(expected['height']);
        }
    }

    return {
        expectGridElement: expectGridElement,
        expectInnerGridElement: expectInnerGridElement,
        getParsedProperties: getParsedProperties
    };
});