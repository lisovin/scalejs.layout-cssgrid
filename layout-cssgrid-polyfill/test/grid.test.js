/*global define,describe,expect,it,beforeEach,afterEach,document,waits,windows*/
/*jslint sloppy: true*/
/// <reference path="../Scripts/jasmine.js"/>
define([
    './gridTestHelper',
    'scalejs!core',
    'knockout',
    'scalejs.layout-cssgrid',
    'jasmine-html'
], function (
    helper,
    core,
    ko
) {
    //TESTS HERE:
    describe('A grid loaded from a template with a single cell', function () {

        //initial setup 
        beforeEach(function () {
            core.layout.parseGridStyles(function () {
                core.layout.invalidate();
            });

            waits(200) //give time to snap into place
        });

        it('correctly places and sizes the only element with fr', function () {
            helper.expectGridElement('single_fr', {
                left: '0px',
                top: '0px',
                width: '400px',
                height: '400px'
            });
        });

        it('correctly places and sizes the only element with auto', function () {
            helper.expectGridElement('single_auto', {
                left: '0px',
                top: '0px',
                width: '400px',
                height: '400px'
            })
        })
    });
});