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
    //prepare the warning logger to capture the WARNING, and then
    var warnings = new Array();

    var extractLog = function () {
        var log = console.log.bind(console);

        var register = function () {
            console.log = function (obj) {
                if (String(obj).indexOf('WARNING') > -1) {
                    warnings.push(obj);
                    revert();
                }
            }
        }

        var revert = function () {
            console.log = log;
        }

        return {
            register: register,
            revert: revert,
        }
    }();

    extractLog.register();

    //BEGIN tests

    describe('The dumpParsedRules debugging function', function () {
        //initial setup
        beforeEach(function () {
            var done = false;
            core.layout.parseGridStyles(function () {
                core.layout.invalidate();
                done = true;
            });

            waitsFor(function () { return done; });

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

    describe('A function defined set with onLayoutDone', function () {

        var foo;

        beforeEach(function () {
            foo = {
                bar: function () { }
            }

            spyOn(foo, 'bar');

            core.layout.onLayoutDone(foo.bar);

        });

        it('is called when invalidate finishes', function () {
            core.layout.invalidate();
            expect(foo.bar).toHaveBeenCalled();
        });
    });

    describe('The extension', function () {
        it('logs errors if duplicate rules are matched to one element (parent or child)', function () {
            expect(warnings.length).toBeGreaterThan(0);
        });
    });
});