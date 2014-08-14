/*global define,describe,expect,it*/
/*jslint sloppy: true*/
/// <reference path="../Scripts/jasmine.js"/>
define([
    './gridTestHelper',
    'scalejs!core',
    'scalejs.layout-cssgrid',
    'jasmine-html'
], function (
    helper,
    core,
    layout
) {
	describe('`extension registered`', function () {

	    var exposed = [
            'core.layout',
            'core.layout.invalidate',
            'core.layout.onLayoutDone',
            'core.layout.parseGridStyles',
            'core.layout.utils',
            'core.layout.utils.safeSetStyle',
            'core.layout.utils.safeGetStyle',
	        'core.layout.utils.getTrackSize',
            'core.layout.utils.getComputedTrackSize',
	        'core.layout.utils.setTrackSize',
	        'core.layout.utils.gridTemplate',
            'core.layout.debug.dumpParsedRules'
	    ];


        exposed.forEach(function (e) {
	        it(e + ' is defined', function () {
	            expect(eval(e)).toBeDefined();
	        });
	    });



		
	});
});