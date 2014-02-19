/*global define */
define([
    'sandbox!main',
    'app/main/viewmodels/mainViewModel',
    'bindings!main',
    'views!main',
    'styles!main'
], function (
    sandbox,
    mainViewModel
) {
    'use strict';

    return function mainModule() {
        var // imports
            root = sandbox.mvvm.root,
            template = sandbox.mvvm.template,
            registerStates = sandbox.state.registerStates,
            state = sandbox.state.builder.state,
            onEntry = sandbox.state.builder.onEntry,
            // vars
            main = mainViewModel(sandbox);

        // Register application state for the module.
        registerStates('app',
            state('main',
                onEntry(function () {
                    // Render viewModel using 'main_template' template 
                    // (defined in main.html) and show it in the `root` region.
                    main.text('Hello World from main!');
                    root(template('main_template', main));
                })));
    };
});
