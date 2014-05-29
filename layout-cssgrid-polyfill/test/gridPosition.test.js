/*global define,describe,expect,it,beforeEach,afterEach,document,waits,window */
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

    var fs = (function () {
        var oldlog = console.log.bind(console);
        var setCustomLog = function () {
            console.log = function (i) {
                // do cool stuff here for testing
                oldlog(i);
                }
            }
        var revertLog = function () {
            console.log = oldlog;
        }
        return {
            setCustomLog: setCustomLog,
            revertLog: revertLog
        };
    })();

    beforeEach(function () {
        var done = false;
        core.layout.parseGridStyles(function () {
            core.layout.invalidate();
            done = true;
        });

        waitsFor(function () { return done; });


        fs.setCustomLog();

    });
    
    afterEach(function () {
        fs.revertLog();
    });

    describe('A grid loaded from a template', function () {


        it('correctly places its first element', function () {
            helper.expectGridElement('simpleGrid__left', {
                left: '0px',
                top: '0px',
                width: '200px',
                height: '300px'
            });
        });
        it('correctly places its second element', function () {
            helper.expectGridElement('simpleGrid__right', {
                left: '200px',
                top: '0px',
                width: '200px',
                height: '300px'
            });
        });
    });

    describe('A grid with rows placed using fr', function () {

        it('correctly places the top element', function () {
            helper.expectGridElement('rowGrid__one', {
                left: '0px',
                top: '0px',
                width: '300px',
                height: '100px'
            });
        });
        it('correctly places the middle element', function () {
            helper.expectGridElement('rowGrid__two', {
                left: '0px',
                top: '100px',
                width: '300px',
                height: '200px'
            });
        });
        it('correctly places the bottom element', function () {
            helper.expectGridElement('rowGrid__three', {
                left: '0px',
                top: '300px',
                width: '300px',
                height: '100px'
            });
        });
    });

    describe('A grid with columns placed using fr', function () {


        it('correctly places the left element', function () {
            helper.expectGridElement('columnGrid__one', {
                left: '0px',
                top: '0px',
                width: '100px',
                height: '300px'
            });
        });
        it('correctly places the middle element', function () {
            helper.expectGridElement('columnGrid__two', {
                left: '100px',
                top: '0px',
                width: '200px',
                height: '300px'
            });
        });
        it('correctly places the right element', function () {
            helper.expectGridElement('columnGrid__three', {
                left: '300px',
                top: '0px',
                width: '100px',
                height: '300px'
            });
        });
    });

    describe('A grid with rows placed using px', function () {


        it('correctly places the top element', function () {
            helper.expectGridElement('rowGridPx__one', {
                left: '0px',
                top: '0px',
                width: '300px',
                height: '100px'
            });
        });
        it('correctly places the middle element', function () {
            helper.expectGridElement('rowGridPx__two', {
                left: '0px',
                top: '100px',
                width: '300px',
                height: '200px'
            });
        });
        it('correctly places the bottom element', function () {
            helper.expectGridElement('rowGridPx__three', {
                left: '0px',
                top: '300px',
                width: '300px',
                height: '100px'
            });
        });
    });

    describe('A grid with columns placed using px', function () {


        it('correctly places the left element', function () {
            helper.expectGridElement('columnGridPx__one', {
                left: '0px',
                top: '0px',
                width: '100px',
                height: '300px'
            });
        });
        it('correctly places the middle element', function () {
            helper.expectGridElement('columnGridPx__two', {
                left: '100px',
                top: '0px',
                width: '200px',
                height: '300px'
            });
        });
        it('correctly places the right element', function () {
            helper.expectGridElement('columnGridPx__three', {
                left: '300px',
                top: '0px',
                width: '100px',
                height: '300px'
            });
        });
    });

    describe('A grid with mixed uses of px and fr with rows and columns', function () {


        it('correctly places the first element', function () {
            helper.expectGridElement('mixedFrPx__one', {
                left: '300px',
                top: '0px',
                width: '100px',
                height: '50px'
            });
        });
        it('correctly places the second element', function () {
            helper.expectGridElement('mixedFrPx__two', {
                left: '200px',
                top: '50px',
                width: '100px',
                height: '100px'
            });
        });
        it('correctly places the third element', function () {
            helper.expectGridElement('mixedFrPx__three', {
                left: '0px',
                top: '150px',
                width: '200px',
                height: '200px'
            });
        });
        it('correctly places the fourth element', function () {
            helper.expectGridElement('mixedFrPx__four', {
                left: '200px',
                top: '350px',
                width: '100px',
                height: '50px'
            });
        });
    });

    describe('A grid with contents that span', function () {
        it('correctly places the first element', function () {
            helper.expectGridElement('span__one', {
                left: '0px',
                top: '0px',
                width: '200px',
                height: '200px'
            });
        });
        it('correctly places the second element', function () {
            helper.expectGridElement('span__two', {
                left: '200px',
                top: '0px',
                width: '100px',
                height: '200px'
            });
        });
        it('correctly places the third element', function () {
            helper.expectGridElement('span__three', {
                left: '0px',
                top: '200px',
                width: '200px',
                height: '100px'
            });
        });
        it('correctly places the fourth element', function () {
            helper.expectGridElement('span__four', {
                left: '200px',
                top: '200px',
                width: '100px',
                height: '100px'
            });
        });
    });

    describe('A grid with overlapping contents', function () {

        it('correctly places the first element', function () {
            helper.expectGridElement('overlap__one', {
                left: '100px',
                top: '100px',
                width: '100px',
                height: '100px'
            });
        });

        it('correctly places the second element', function () {
            helper.expectGridElement('overlap__two', {
                left: '100px',
                top: '0px',
                width: '100px',
                height: '200px'
            });
        });
        it('correctly places the third element', function () {
            helper.expectGridElement('overlap__three', {
                left: '0px',
                top: '0px',
                width: '300px',
                height: '300px'
            });
        });
        it('correctly places the fourth element', function () {
            helper.expectGridElement('overlap__four', {
                left: '200px',
                top: '200px',
                width: '100px',
                height: '100px'
            });
        });
    });

    describe('A simple grid for testing default values', function () {

        it('correctly places an element with no values given', function () {
            helper.expectGridElement('defaultValueTest__one', {
                left: '0px',
                top: '0px',
                width: '100px',
                height: '100px'
            });
        });

    });

    describe('A grid with split css rules', function () {


        it('correctly places the first element', function () {
            helper.expectGridElement('splitCSS__one', {
                left: '100px',
                top: '100px',
                width: '100px',
                height: '100px'
            });
        });

    });

    describe('A grid that resizes its parent div', function () {

        it('correctly places the first element', function () {
            helper.expectGridElement('resize__one', {
                left: '100px',
                top: '100px',
                width: '200px',
                height: '200px'
            });
        });

        it('correctly resizes the div when the parent changes', function () {

            core.layout.utils.safeSetStyle(document.getElementById('resizeGrid'), 'width', '600px');
            core.layout.utils.safeSetStyle(document.getElementById('resizeGrid'), 'height', '600px');

            core.layout.invalidate();

            helper.expectGridElement('resize__one', {
                left: '200px',
                top: '200px',
                width: '400px',
                height: '400px'
            });
        });


    });

    describe('A grid with aligned elements', function () {

        it('correctly places elements with every possible align combination', function () {
            var styles = ['start', 'end', 'center', 'stretch'];
        



            styles.forEach(function (element) {
                core.layout.utils.safeSetStyle(document.getElementById('align__one'), 'width', '50px');
                core.layout.utils.safeSetStyle(document.getElementById('align__one'), 'height', '50px');
                core.layout.utils.safeSetStyle(document.getElementById('align__one'), '-ms-grid-row-align', element);
                styles.forEach(function (insideElement) {
                    core.layout.utils.safeSetStyle(document.getElementById('align__one'), '-ms-grid-column-align', insideElement);
                    if (core.layout.utils.safeGetStyle(document.getElementById('align__one'), '-ms-grid-column-align') !== insideElement) { console.log('ERROR');}

                    core.layout.invalidate();

                    var rowStyle = core.layout.utils.safeGetStyle(document.getElementById('align__one'), '-ms-grid-row-align');
                    var columnStyle = insideElement;
                    var expectedVertSize = (rowStyle === 'stretch') ? '100px' : '50px';
                    var expectedHorizontalSize = (columnStyle === 'stretch') ? '100px' : '50px';
                    var expectedLeftOffset;
                    if (columnStyle === 'start') { expectedLeftOffset = '0px'; }
                    if (columnStyle === 'center') { expectedLeftOffset = '25px'; }
                    if (columnStyle === 'end') { expectedLeftOffset = '50px'; }
                    if (columnStyle === 'stretch') { expectedLeftOffset = '0px'; }
                    var expectedTopOffset;
                    if (rowStyle === 'start') { expectedTopOffset = '0px'; }
                    if (rowStyle === 'center') { expectedTopOffset = '25px'; }
                    if (rowStyle === 'end') { expectedTopOffset = '50px'; }
                    if (rowStyle === 'stretch') { expectedTopOffset = '0px'; }
                    helper.expectGridElement('align__one', {
                        left: expectedLeftOffset,
                        top: expectedTopOffset,
                        width: expectedHorizontalSize,
                        height: expectedVertSize
                    });
                });
            });
        });
    });
});