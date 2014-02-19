/*global define,jasmine*/
define([
    'jasmine-html',
    './gridExtensionRegistered.test',
    './gridPosition.test',
    './gridCssSources.test'
], function () {
    'use strict';

    var jasmineEnv = jasmine.getEnv(),
        htmlReporter = new jasmine.HtmlReporter();

    jasmineEnv.updateInterval = 1000;
    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };

    jasmineEnv.execute();
});
