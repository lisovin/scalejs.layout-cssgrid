/*global define, require, document, console, window, clearTimeout, setTimeout */
define([
    './cssGridLayout',
    './utils',
], function (
    cssGridLayout,
    utils
) {
    'use strict';

    /// Template generator for use with knockout.js
    /// Creates a template with a custom afterRender function, specifically for calling invalidate as the template is rendered
    /// If you wish elements to be invisible before they are layed out, 


    return function (template_name, template_data) {
        var result = {
                name: template_name
            },
            unwrapped_data = (typeof template_data === 'function')?(template_data()):(template_data);

        function invalidateAfterRender(elements) {
            elements.forEach(function (element) {
                if (!(element.nodeName === '#text' || element.nodeName === '#comment')) {
                    cssGridLayout.invalidate({ container: element.parentNode });
                    utils.safeSetStyle(element, 'visibility', 'visible');
                }
            });
        };

        result.afterRender = invalidateAfterRender;

        if (Array.isArray(unwrapped_data)) {
            result.foreach = template_data;
        } else {
            result.data = template_data;
        }

        return result;
    }
});