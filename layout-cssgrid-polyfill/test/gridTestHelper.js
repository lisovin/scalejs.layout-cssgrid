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
        expectGridElement: expectGridElement
    };
});