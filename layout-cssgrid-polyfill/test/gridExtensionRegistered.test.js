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

		it('core.layout is defined', function () {
			expect(core.layout).toBeDefined();
		});
		it('core.layout.invalidate is defined', function () {
			expect(core.layout.invalidate).toBeDefined();
		});
		it('core.layout.onLayoutDone is defined', function () {
			expect(core.layout.onLayoutDone).toBeDefined();
		});
	});
});