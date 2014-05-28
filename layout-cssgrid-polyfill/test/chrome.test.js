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
    describe('The dumpParsedRules debugging function', function () {
        //initial setup
        beforeEach(function () {
            core.layout.parseGridStyles(function () {
                core.layout.invalidate();
            });

            waits(200) //give time to snap into place
        });

        it('properly describes the size of an element', function () {
            var info = new Array(),
                props;

            var extractLog = function () {
                var log = console.log.bind(console);

                var register = function () {
                    console.log = function (obj) {
                        if (typeof (obj) === 'object') {
                            info.push(obj);
                            //TODO
                            log(obj);
                        }
                    }
                }

                var revert = function () {
                    console.log = log;
                }

                return {
                    register: register,
                    revert: revert
                }
            }();

            //collect rules
            extractLog.register();
            core.layout.debug.dumpParsedRules();
            extractLog.revert();

            props = helper.getParsedProperties('width__grid', info[0]);

            //expectations
            expect(props.width).toBe('400px');
            expect(props.height).toBe('100px');
        });
    });
});