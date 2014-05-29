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
    var wrapLog = function () {
        var log = console.log.bind(console);

        var revert = function () {
            console.log = log;
        }

        var register = function () {
            console.log = function (i) {
                //fun stuff
                log("function: " + i);
            }
        }

        return {
            revert: revert,
            register: register
        }
    }();

    //initial setup 
    beforeEach(function () {
        var done = false;
        core.layout.parseGridStyles(function () {
            core.layout.invalidate();
            done = true;
        });

        waitsFor(function () { return done; });
    });

    //TESTS HERE:
    describe('A grid loaded from a template with a single cell', function () {

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

        it('is displayed correctly', function () {
            helper.expectGridElement('href__left', {
                left: '0px',
                top: '0px',
                width: '100px',
                height: '200px'
            });

            helper.expectGridElement('href__right', {
                left: '100px',
                top: '0px',
                width: '300px',
                height: '200px'
            });
        });

    });

    describe('A grid with multiple elements in a track', function () {

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

    describe('A grid loaded from a template', function () {
        
        it('follows proper css inheritance using an external stylesheet and internal stylesheet', function () {
            helper.expectGridElement('inher__left', {
                left: '0px',
                top: '0px',
                width: '30px',
                height: '100px'
            });
            helper.expectGridElement('inher__right', {
                left: '30px',
                top: '0px',
                width: '70px',
                height: '100px'
            });
        });

        it('follows proper css inheritance using an internal stylesheet and inline styles', function () {
            helper.expectGridElement('inher__left--in', {
                left: '0px',
                top: '0px',
                width: '200px',
                height: '400px'
            });
            helper.expectGridElement('inher__right--in', {
                left: '200px',
                top: '0px',
                width: '200px',
                height: '400px'
            });
        });

        it('follows proper css inheritance using an external stylesheet and inline styles', function () {
            helper.expectGridElement('inher__left--exinl', {
                left: '0px',
                top: '0px',
                width: '200px',
                height: '400px'
            });
            helper.expectGridElement('inher__right--exinl', {
                left: '200px',
                top: '0px',
                width: '200px',
                height: '400px'
            });
        });

        it('follows proper css inheritance using an external stylesheet, an internal stylesheet, and inline styles', function () {
            helper.expectGridElement('inher__left--all', {
                left: '0px',
                top: '0px',
                width: '200px',
                height: '400px'
            });
            helper.expectGridElement('inher__right--all', {
                left: '200px',
                top: '0px',
                width: '200px',
                height: '400px'
            });
        });
    });
});