/*global define*/
/*jslint unparam:true*/
define(['require'], function (require) {
    'use strict';

    var pluginBuilder = './Scripts/scalejs.styles-builder',
        head,
        base,
        pagePath,
        styleCnt = 0,
        curStyle;

    if (typeof window === 'undefined') {
        return {
            pluginBuilder: pluginBuilder,
            load: function (name, req, onLoad) {
                onLoad();
            }
        };
    }

    function normalize(name, normalize) {
        if (name.substr(name.length - 5, 5) == '.less')
            name = name.substr(0, name.length - 5);

        name = normalize(name);

        return name;
    }

    function inject(css) {
        if (styleCnt < 31) {
            curStyle = document.createElement('style');
            curStyle.type = 'text/css';
            head.appendChild(curStyle);
            styleCnt++;
        }
        if (curStyle.styleSheet) {
            curStyle.styleSheet.cssText += css;
        } else {
            curStyle.appendChild(document.createTextNode(css));
        }
    }

    function init() {
        head = document.getElementsByTagName('head')[0];

        base = document.getElementsByTagName('base');
        base = base && base[0] && base[0] && base[0].href;

        pagePath = (base || window.location.href.split('#')[0].split('?')[0]).split('/');
        pagePath[pagePath.length - 1] = '';
        pagePath = pagePath.join('/');

        // set initial default configuration
        window.less = window.less || {
            env: 'development'
        };
    }


    function load(name, req, onLoad, config) {
        var names = name.match(/([^,]+)/g) || [],
            imports;

        names = names.map(function (n) {
            if (n.indexOf('/') === -1) {
                return 'app/' + n + '/styles/' + n;
            }

            return n;
        });

        imports = names.reduce(function (state, n) {
            return state + '@import "' + n + '";';
        }, '');

        require(['./lessc', './normalize'], function (lessc, normalize) {

            var parser = new lessc.Parser(window.less);

            parser.parse(imports, function (err, tree) {
                if (err) {
                    return onLoad.error(err);
                }

                var css,
                    normalized;

                css = tree.toCSS(config.less);
                //normalized = normalize(css, fileUrl, pagePath);

                inject(css);

                setTimeout(onLoad, 7);
            });
        });
    }

    init();

    return {
        pluginBuilder: pluginBuilder,
        load: load
    };
});