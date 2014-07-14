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
    describe('An element in a grid sized with auto', function () {

        //ensure proper loading
        beforeEach(function () {
            var done = false;
            core.layout.parseGridStyles(function () {
                core.layout.invalidate();
                done = true;
            });

            waitsFor(function () { return done; });
        });

        it('correctly sets the track sizes when the width is set inline', function () {
            helper.expectGridElement('inline__right', {
                left: '150px',
                top: '0px',
                width: '350px',
                height: '100px'
            });
        });

        it('correctly sets the track sizes when the width is set on a stylesheet', function () {
            helper.expectGridElement('style__right', {
                left: '200px',
                top: '0px',
                width: '300px',
                height: '100px'
            });
        });

        it('correctly sets the cell size when the width is set by the children', function () {
            helper.expectGridElement('child__center', {
                left: '100px',
                top: '0px',
                width: '100px',
                height: '100px'
            })
        });

        it('correctly sets the track sizes when the width is set by the children', function () {
            helper.expectGridElement('child__right', {
                left: '200px',
                top: '0px',
                width: '300px',
                height: '100px'
            });
        });

        it('correctly sets the cell size when the width is set by nested children', function () {
            helper.expectGridElement('nested__center', {
                left: '100px',
                top: '0px',
                width: '100px',
                height: '100px'
            })
        });

        it('correctly sets the track sizes when the width is set by nested children', function () {
            helper.expectGridElement('nested__right', {
                left: '200px',
                top: '0px',
                width: '300px',
                height: '100px'
            });
        });
    });
});