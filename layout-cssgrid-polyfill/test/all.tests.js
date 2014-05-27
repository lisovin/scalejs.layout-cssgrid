/*global define,jasmine*/
define([
    'scalejs!core',
    'text!test/testTemplates.html',
    'text!test/grid.html',
    'styles!test/testStyles',
    'styles!test/grid',
    'jasmine-html',
    './gridExtensionRegistered.test',
    './gridPosition.test',
    './grid.test'
], function (
    core,
    template,
    template0
) {
    'use strict';

    var jasmineEnv = jasmine.getEnv(),
        htmlReporter = new jasmine.HtmlReporter();

    jasmineEnv.updateInterval = 1000;
    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };

    //repeat for all of mine
    var templateNode = document.createElement('div');
    templateNode.innerHTML = template;
    templateNode.style.visibility = 'hidden';
    templateNode.style.position = 'absolute';
    document.body.appendChild(templateNode);

    var templateNode = document.createElement('div');
    templateNode.innerHTML = template0;
    templateNode.style.visibility = 'hidden';
    templateNode.style.position = 'absolute';
    document.body.appendChild(templateNode);

    jasmineEnv.execute();
});
