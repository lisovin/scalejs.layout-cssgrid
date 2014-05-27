/*global define,jasmine*/
define([
    'scalejs!core',
    'text!test/testTemplates.html',
    'styles!test/testStyles',
    'jasmine-html',
    './gridExtensionRegistered.test',
    './gridPosition.test',
], function (
    core,
    templates
) {
    'use strict';

    var jasmineEnv = jasmine.getEnv(),
        htmlReporter = new jasmine.HtmlReporter();

    jasmineEnv.updateInterval = 1000;
    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };

    var templateNode = document.createElement('div');
    templateNode.innerHTML = templates;
    templateNode.style.visibility = 'hidden';
    templateNode.style.position = 'absolute';
    document.body.appendChild(templateNode);

    jasmineEnv.execute();
});
