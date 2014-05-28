/*global define,jasmine*/
define([
    'scalejs!core',
    'text!test/testTemplates.html',
    'text!test/grid.html',
    'text!test/chrome.html',
    'styles!test/testStyles',
    'styles!test/grid',
    'styles!test/chrome',
    'jasmine-html',
    './gridPosition.test',
    './grid.test',
    './chrome.test'
], function (
    core,
    template,
    grid,
    chrome
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
    templateNode.innerHTML = grid;
    templateNode.style.visibility = 'hidden';
    templateNode.style.position = 'absolute';
    document.body.appendChild(templateNode);

    var templateNode = document.createElement('div');
    templateNode.innerHTML = chrome;
    templateNode.style.visibility = 'hidden';
    templateNode.style.position = 'absolute';
    document.body.appendChild(templateNode);

    jasmineEnv.execute();
});
