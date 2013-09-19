/*global define, document, window */
define([
    './consts',
    './utils.base'
], function (
    consts,
    utils
) {
    'use strict';

    var HYPHEN = consts.HYPHEN,
        EMPTY = consts.EMPTY,
        STRING = consts.STRING,
        GRIDLAYOUT = consts.GRIDLAYOUT,
        SPACE = consts.SPACE,
        ALL = 'all',
        MEDIA = 'media',
        TYPE = consts.TYPE,
        defined = utils.defined,
        is = utils.is,
        headEl = document.getElementsByTagName('head')[0],
        styleEl = document.createElement('style'),
        embedded_css = [],
        addRules;

    styleEl.setAttribute(TYPE, 'text/css');

    if (defined(styleEl.styleSheet)) {
        addRules = function (el, styles) {
            el.styleSheet.cssText += styles;
        };
    } else {
        addRules = function (el, styles) {
            el.appendChild(document.createTextNode(styles));
        };
    }

    function low(w) {
        return is(w, STRING) ? w.toLowerCase() : w;
    }

    function camelize(str) {
        var regex = /(-[a-z])/g,
            func = function (bit) {
                return bit.toUpperCase().replace(HYPHEN, EMPTY);
            };

        return is(str, STRING)
            ? low(str).replace(regex, func)
            : str;
    }

    /**
     * eCSStender::makeUniqueClass()
     * creates a unique class for an element
     * 
     * @return str - the unique class
     */
    function makeUniqueClass() {
        var start = new Date().getTime();

        start += Math.floor(Math.random() * start);

        return GRIDLAYOUT + HYPHEN + start;
    }

    function newRegExp(rxp) {
        return new RegExp(rxp);
    }

    function makeClassRegExp(the_class) {
        return newRegExp('(\\s|^)' + the_class + '(\\s|$)');
    }

    /**
     * checks to see if an element has the given class
     *
     * @param obj el - the element to have its class augmented
     * @param str the_class - the class to add
     * @param RegExp re - a regular expression to match the class (optional)
     */
    function hasClass(el, the_class, re) {
        re = re || makeClassRegExp(the_class);
        return el.className.match(re);
    }

    /**
     * adds a class to an element
     *
     * @param obj el - the element to have its class augmented
     * @param str the_class - the class to add
     * @param RegExp re - a regular expression to match the class (optional)
     */
    function addClass(el, the_class, re) {
        re = re || makeClassRegExp(the_class);
        if (!hasClass(el, the_class, re)) {
            el.className += SPACE + the_class;
        }
    }

    function in_object(needle, haystack) {
        var key;
        for (key in haystack) {
            if (haystack[key] === needle) { return true; }
        }
        return false;
    }

    /**
     * adds a new stylesheet to the document
     *
     * @param str media  - the media to apply the stylesheet to
     * @param str id     - the id to give the stylesheet (optional)
     * @param bool delay - whether or not to delay the writing of the stylesheet (default = true)
     * 
     * @return obj - the STYLE element
     */
    function newStyleElement(media, id) {
        // clone the model style element
        var style = styleEl.cloneNode(true);
        // set the media type & id
        media = media || ALL;
        style.setAttribute(MEDIA, media);
        id = id || 'temp-' + Math.round(Math.random() * 2 + 1);
        style.setAttribute('id', id);
        headEl.appendChild(style);
        // return the element reference
        return style;
    }

    function clearEmbeddedCss(media, suffix) {
        var id, style;

        suffix = suffix ? '-' + suffix : '';
        media = media || ALL;

        id = GRIDLAYOUT + HYPHEN + media + suffix;

        style = document.getElementById(id);
        if (style) {
            while (style.childNodes.length > 0) {
                style.removeChild(style.childNodes[0]);
            }
        }
    }

    /**
       * embeds styles to the appropriate media
       *
       * @param str styles - the styles to embed
       * @param str media  - the media to apply the stylesheet to (optional)
       * @param bool delay - whether or not to delay the writing of the stylesheet (default = true)
       * 
       * @return obj - the STYLE element
       */
    function embedCss(styles, media, suffix) {
        // determine the medium
        media = media || ALL;
        suffix = suffix ? '-' + suffix : '';
        // determine the id
        var id = GRIDLAYOUT + HYPHEN + media + suffix, style;
        // find or create the embedded stylesheet
        if (!in_object(media + suffix, embedded_css)) {
            // make the new style element
            style = newStyleElement(media, id);
            // store the medium
            embedded_css.push(media + suffix);
        } else {
            style = document.getElementById(id);
        }
        // add the rules to the sheet
        if (style !== null) {
            addRules(style, styles);
        }
        // return the style element
        return style;
    }


    /**
       * eCSStender::getCSSValue()
       * gets the computed value of a CSS property
       *
       * @param obj el - the element
       * @param str prop - the property name
       * 
       * @return str - the value
       */
    function getCssValue(el, prop) {
        var computed = window.getComputedStyle;
        if (el.currentStyle) {
            return el.currentStyle[camelize(prop)];
        }

        if (computed) {
            return computed(el, null).getPropertyValue(prop);
        }

        return false;
    }

    return {
        makeUniqueClass: makeUniqueClass,
        getCssValue: getCssValue,
        addClass: addClass,
        embedCss: embedCss,
        clearEmbeddedCss: clearEmbeddedCss
    };
});