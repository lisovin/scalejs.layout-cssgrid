﻿/*global define,describe,expect,it,beforeEach,afterEach,document,waits,windows*/
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
    //NOT USED
    var wrapLog = function () {
        var old = console.log.bind(console);

        var revert = function () {
            console.log = old;
        }

        var register = function () {
            console.log = function (i) {
                old("old <<< " + i);
            }
        }

        return {
            revert: revert,
            register: register
        }
    }();

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
            helper.expectGridElement('single__cell--fr', {
                left: '0px',
                top: '0px',
                width: '400px',
                height: '400px'
            });
        });

        it('correctly places and sizes the only element with auto', function () {
            helper.expectGridElement('single__cell--auto', {
                left: '0px',
                top: '0px',
                width: '0px',
                height: '0px'
            });
        })

        it('correctly places and sizes the only element with px', function () {
            helper.expectGridElement('single__cell--px', {
                left: '0px',
                top: '0px',
                width: '100px',
                height: '100px',
            });
        });
    });

    describe('A nested grid loaded from a template with a separate inner div for the inner grid', function () {

        //initial setup
        beforeEach(function () {
            core.layout.parseGridStyles(function () {
                core.layout.invalidate();
            });

            waits(200) //give time to snap into place
        });

        it('correctly sets up outer grid', function () {
            helper.expectGridElement('outer__top', {
                left: '0px',
                top: '0px',
                width: '800px',
                height: '300px'
            });
            helper.expectGridElement('outer__bottom', {
                left: '0px',
                top: '300px',
                width: '800px',
                height: '500px'
            });
        });

        it('correctly sets up inner grid', function () {
            helper.expectInnerGridElement('inner__top', 3, {
                left: '0px',
                top: '300px',
                width: '800px',
                height: '250px'
            });
            helper.expectInnerGridElement('inner__bottom', 3, {
                left: '0px',
                top: '550px',
                width: '800px',
                height: '250px'
            });
        });
    });

    describe('A nested grid loaded from a template with the bottom cell as the inner grid', function () {

        //initial setup
        beforeEach(function () {
            core.layout.parseGridStyles(function () {
                core.layout.invalidate();
            });

            waits(200) //give time to snap into place
        });

        it('correctly sets up outer grid', function () {
            helper.expectGridElement('outer__top--c', {
                left: '0px',
                top: '0px',
                width: '800px',
                height: '300px'
            });
            helper.expectGridElement('outer__bottom-grid--c', {
                left: '0px',
                top: '300px',
                width: '800px',
                height: '500px'
            });
        });

        it('correctly sets up inner grid', function () {
            helper.expectInnerGridElement('inner__top--c', 2, {
                left: '0px',
                top: '300px',
                width: '800px',
                height: '250px'
            });
            helper.expectInnerGridElement('inner__bottom--c', 2, {
                left: '0px',
                top: '550px',
                width: '800px',
                height: '250px'
            });
        });
    });

    describe('A grid with css loaded by href', function () {

        //initial setup
        beforeEach(function () {
            core.layout.parseGridStyles(function () {
                core.layout.invalidate();
            });

            waits(200) //give time to snap into place

            wrapLog.register();
        });

        it('is displayed correctly', function () {
            helper.expectGridElement('href__left', {
                left: '0px',
                top: '0px',
                width: '100px',
                height: '200px'
            });

            console.log('dicks');

            helper.expectGridElement('href__right', {
                left: '100px',
                top: '0px',
                width: '300px',
                height: '200px'
            });
        });

        afterEach(function () {
            wrapLog.revert();
            console.log("whaddup");
        });
    });

    describe('A grid with multiple elements in a track', function () {
        //initial setup
        beforeEach(function () {
            core.layout.parseGridStyles(function () {
                core.layout.invalidate();
            });

            waits(200) //give time to snap into place
        });

        it('has the auto height determined by the elements', function () {
            helper.expectGridElement('multi__cell--height', {
                left: '0px',
                top: '0px',
                width: '400px',
                height: '250px'
            });
        });

        it('has the auto width determined by the elements', function () {
            helper.expectGridElement('multi__cell--width', {
                left: '0px',
                top: '0px',
                width: '180px',
                height: '300px'
            });
        });
    });

    describe('A grid loaded from a template with static fixed-size content', function () {
        //initial setup
        beforeEach(function () {
            core.layout.parseGridStyles(function () {
                core.layout.invalidate();
            });

            waits(200) //give time to snap into place
        });

        it('has auto height determined correctly', function () {
            helper.expectGridElement('height__cell', {
                left: '0px',
                top: '0px',
                width: '100px',
                height: '150px'
            });
        });

        it('has auto width determined correctly', function () {
            helper.expectGridElement('width__cell', {
                left: '0px',
                top: '0px',
                width: '100px',
                height: '100px'
            });
        });
    });
});