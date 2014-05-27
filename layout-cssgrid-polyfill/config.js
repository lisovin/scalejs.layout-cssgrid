var require = {
    "baseUrl":  ".",
    "config":  {
        "scalejs.statechart-scion":  {
            "logStatesEnteredAndExited":  true
        }
    },
    "paths":  {
        "bindings":  "Scripts/scalejs.mvvm.bindings",
        "css":  "Scripts/css",
        "css-builder":  "Scripts/css-builder",
        "CSS.supports":  "Scripts/CSS.supports",
        "cssparser":  "Scripts/cssparser",
        "domReady":  "Scripts/domReady",
        "jasmine":  "Scripts/jasmine",
        "jasmine-html":  "Scripts/jasmine-html",
        "knockout":  "Scripts/knockout-3.0.0.debug",
        "knockout.mapping":  "Scripts/knockout.mapping-latest.debug",
        "less":  "Scripts/less",
        "less-builder":  "Scripts/less-builder",
        "lessc":  "Scripts/lessc",
        "linqjs":  "Scripts/linq.min",
        "normalize":  "Scripts/normalize",
        "sandbox":  "Scripts/scalejs.sandbox",
        "scalejs":  "Scripts/scalejs-0.3.3",
        "scalejs.functional":  "Scripts/scalejs.functional-0.2.9.8",
        "scalejs.layout-cssgrid":  "Scripts/scalejs.layout-cssgrid-0.2.7.126",
        "scalejs.linq-linqjs":  "Scripts/scalejs.linq-linqjs-3.0.3.1",
        "scalejs.mvvm":  "Scripts/scalejs.mvvm-0.3.4.4",
        "scalejs.statechart-scion":  "Scripts/scalejs.statechart-scion-0.3.0.0",
        "scion":  "Scripts/scion",
        "styles":  "Scripts/scalejs.styles",
        "text":  "Scripts/text",
        "views":  "Scripts/scalejs.mvvm.views"
    },
    "scalejs":  {
        "extensions":  [
            "scalejs.functional",
            "scalejs.layout-cssgrid",
            "scalejs.layout-cssgrid",
            "scalejs.linq-linqjs",
            "scalejs.mvvm",
            "scalejs.statechart-scion"
        ]
    },
    "shim":  {
        "CSS.supports":  {
            "exports":  "CSS"
        },
        "jasmine":  {
            "exports":  "jasmine"
        },
        "jasmine-html":  {
            "deps":  [
                "jasmine"
            ]
        },
        "scalejs.statechart-scion":  {
            "deps":  [
                "scalejs.linq-linqjs",
                "scalejs.functional"
            ]
        }
    }
};
