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

        console.log(element_id + "  " + element_rect.left + " " + element_rect.top + " " + element_rect.height + " " + element_rect.width);
        console.log("gr: " + ancestor_rect.left + " " + ancestor_rect.top + " " + ancestor_rect.height + " " + ancestor_rect.width);

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
        expectInnerGridElement: expectInnerGridElement
    };
});