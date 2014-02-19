
/**
 * almond 0.2.6 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("Scripts/almond", function(){});


/*global define,window,requirejs */
define('scalejs',[],function () {
    
    var extensionNames;

    return {
        load: function (name, req, load, config) {
            var moduleNames;

            if (name === 'extensions') {
                if (config.scalejs && config.scalejs.extensions) {
                    extensionNames = config.scalejs.extensions;
                    req(extensionNames, function () {
                        load(Array.prototype.slice(arguments));
                    });
                } else {
                    req(['scalejs/extensions'], function () {
                        load(Array.prototype.slice(arguments));
                    }, function () {
                        // No extensions defined, which is strange but might be ok.
                        load([]);
                    });
                }
                return;
            }

            if (name.indexOf('application') === 0) {
                moduleNames = name
                    .substring('application'.length + 1)
                    .match(/([^,]+)/g) || [];

                moduleNames = moduleNames.map(function (n) {
                    if (n.indexOf('/') === -1) {
                        return 'app/' + n + '/' + n + 'Module';
                    }

                    return n;
                });

                moduleNames.push('scalejs/application');

                req(['scalejs!extensions'], function () {
                    req(moduleNames, function () {
                        var application = arguments[arguments.length - 1],
                            modules = Array.prototype.slice.call(arguments, 0, arguments.length - 1);

                        if (!config.isBuild) {
                            application.registerModules.apply(null, modules);
                        }

                        load(application);
                    });
                });
                return;
            }

            req(['scalejs/' + name], function (loadedModule) {
                load(loadedModule);
            });
        },

        write: function (pluginName, moduleName, write) {
            if (pluginName === 'scalejs' && moduleName.indexOf('application') === 0) {
                write('define("scalejs/extensions", ' + JSON.stringify(extensionNames) + ', function () { return Array.prototype.slice(arguments); })');
            }
        }
    };
});

/*global define,console,document*/
define('scalejs/base.type',[],function () {
    
    function typeOf(obj) {
        if (obj === undefined) {
            return 'undefined';
        }

        if (obj === null) {
            return 'null';
        }

        var t = ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase(),
            m;

        if (t !== 'object') {
            return t;
        }

        m = obj.constructor.toString().match(/^function\s*([$A-Z_][0-9A-Z_$]*)/i);
        if (m === null) {
            return 'object';
        }

        return m[1];
    }

    function is(value) {
        // Function: is([...,]value[,type]): boolean
        // Check the type of a value, possibly nested in sub-properties.
        //
        // The method may be called with a single argument to check that the value
        // is neither null nor undefined.
        //
        // If more than two arguments are provided, the value is considered to be
        // nested within a chain of properties starting with the first argument:
        // | is(object,'parent','child','leaf','boolean')
        // will check whether the property object.parent.child.leaf exists and is
        // a boolean.
        //
        // The intent of this method is to replace unsafe guard conditions that
        // rely on type coercion:
        // | if (object && object.parent && object.parent.child) {
        // |   // Issue: all falsy values are treated like null and undefined:
        // |   // '', 0, false...
        // | }
        // with a safer check in a single call:
        // | if ( is(object,'parent','child','number') ) {
        // |   // only null and undefined values are rejected
        // |   // and the type expected (here 'number') is explicit
        // | }
        //
        // Parameters:
        //   ...   - any, optional, a chain of parent properties for a nested value
        //   value - any, the value to check, which may be nested in a chain made
        //           of previous arguments (see above)
        //   type - string, optional, the type expected for the value.
        //          Alternatively, a constructor function may be provided to check
        //          whether the value is an instance of given constructor.
        //
        // Returns:
        //   * false, if no argument is provided
        //   * false, if a single argument is provided which is null or undefined
        //   * true, if a single argument is provided, which is not null/undefined
        //   * if the type argument is a non-empty string, it is compared with the
        //     internal class of the value, put in lower case
        //   * if the type argument is a function, the instanceof operator is used
        //     to check if the value is considered an instance of the function
        //   * otherwise, the value is compared with the provided type using the
        //     strict equality operator ===
        //
        // Type Reference:
        //   'undefined' - undefined
        //   'null'      - null
        //   'boolean'   - false, true
        //   'number'    - -1, 0, 1, 2, 3, Math.sqrt(2), Math.E, Math.PI...
        //   'string'    - '', 'abc', "Text!?"...
        //   'array'     - [], [1,2,3], ['a',{},3]...
        //   'object'    - {}, {question:'?',answer:42}, {a:{b:{c:3}}}...
        //   'regexp'    - /abc/g, /[0-9a-z]+/i...
        //   'function'  - function(){}, Date, setTimeout...
        //
        // Notes:
        // This method retrieves the internal class of the provided value using
        // | Object.prototype.toString.call(value).slice(8, -1)
        // The class is then converted to lower case.
        //
        // See "The Class of an Object" section in the JavaScript Garden for
        // more details on the internal class:
        // http://bonsaiden.github.com/JavaScript-Garden/#types.typeof
        //
        // The internal class is only guaranteed to be the same in all browsers for
        // Core JavaScript classes defined in ECMAScript. It differs for classes
        // part of the Browser Object Model (BOM) and Document Object Model (DOM):
        // window, document, DOM nodes:
        //
        //   window        - 'Object' (IE), 'Window' (Firefox,Opera),
        //                   'global' (Chrome), 'DOMWindow' (Safari)
        //   document      - 'Object' (IE),
        //                   'HTMLDocument' (Firefox,Chrome,Safari,Opera)
        //   document.body - 'Object' (IE),
        //                   'HTMLBodyElement' (Firefox,Chrome,Safari,Opera)
        //   document.createElement('div') - 'Object' (IE)
        //                   'HTMLDivElement' (Firefox,Chrome,Safari,Opera)
        //   document.createComment('') - 'Object' (IE),
        //                   'Comment' (Firefox,Chrome,Safari,Opera)
        //
        var undef, // do not trust global undefined, which may be overridden
            i,
            length = arguments.length,
            last = length - 1,
            type,
            typeOfType,
            internalClass,
            v = value;


        if (length === 0) {
            return false; // no argument
        }

        if (length === 1) {
            return (value !== null && value !== undef);
        }

        if (length > 2) {
            for (i = 0; i < last - 1; i += 1) {
                if (!is(v)) {
                    return false;
                }
                v = v[arguments[i + 1]];
            }
        }

        type = arguments[last];
        if (v === null) {
            return (type === null || type === 'null');
        }
        if (v === undef) {
            return (type === undef || type === 'undefined');
        }
        if (type === '') {
            return v === type;
        }

        typeOfType = typeof type;
        if (typeOfType === 'string') {
            internalClass =
                Object.prototype
                    .toString
                    .call(v)
                    .slice(8, -1)
                    .toLowerCase();
            return internalClass === type;
        }

        if (typeOfType === 'function') {
            return v instanceof type;
        }

        return v === type;
    }

    return {
        is : is,
        typeOf : typeOf
    };
});

/*global define,console,document*/
define('scalejs/base.object',[
    './base.type'
], function (
    type
) {
    

    var is = type.is;

    function has(object) {
        // Function: has(obj,property[,...]): boolean
        // Check whether an obj property is present and not null nor undefined.
        //
        // A chain of nested properties may be checked by providing more than two
        // arguments.
        //
        // The intent of this method is to replace unsafe tests relying on type
        // coercion for optional arguments or obj properties:
        // | function on(event,options){
        // |   options = options || {}; // type coercion
        // |   if (!event || !event.data || !event.data.value){
        // |     // unsafe due to type coercion: all falsy values '', false, 0
        // |     // are discarded, not just null and undefined
        // |     return;
        // |   }
        // |   // ...
        // | }
        // with a safer test without type coercion:
        // | function on(event,options){
        // |   options = has(options)? options : {}; // no type coercion
        // |   if (!has(event,'data','value'){
        // |     // safe check: only null/undefined values are rejected;
        // |     return;
        // |   }
        // |   // ...
        // | }
        //
        // Parameters:
        //   obj - any, an obj or any other value
        //   property - string, the name of the property to look up
        //   ...      - string, additional property names to check in turn
        //
        // Returns:
        //   * false if no argument is provided or if the obj is null or
        //     undefined, whatever the number of arguments
        //   * true if the full chain of nested properties is found in the obj
        //     and the corresponding value is neither null nor undefined
        //   * false otherwise
        var i,
            length,
            o = object,
            property;

        if (!is(o)) {
            return false;
        }

        for (i = 1, length = arguments.length; i < length; i += 1) {
            property = arguments[i];
            o = o[property];
            if (!is(o)) {
                return false;
            }
        }
        return true;
    }

    function mix(receiver, supplier) {
        var p;
        for (p in supplier) {
            if (supplier.hasOwnProperty(p)) {
                if (has(supplier, p) &&
                        supplier[p].constructor === Object &&
                            has(receiver, p)) {
                    receiver[p] = mix(receiver[p], supplier[p]);
                } else {
                    receiver[p] = supplier[p];
                }
            }
        }

        return receiver;
    }

    function merge() {
        var args = arguments,
            i,
            len = args.length,
            result = {};

        for (i = 0; i < len; i += 1) {
            mix(result, args[i]);
        }

        return result;
    }

    function clone(o) {
        return merge({}, o);
    }

    function extend(receiver, extension, path) {
        var props = has(path) ? path.split('.') : [],
            target = receiver,
            i;

        for (i = 0; i < props.length; i += 1) {
            if (!has(target, props[i])) {
                target[props[i]] = {};
            }
            target = target[props[i]];
        }

        mix(target, extension);

        return target;
    }

    function get(o, path, defaultValue) {
        var props = path.split('.'),
            i,
            p,
            success = true;

        for (i = 0; i < props.length; i += 1) {
            p = props[i];
            if (has(o, p)) {
                o = o[p];
            } else {
                success = false;
                break;
            }
        }

        return success ? o : defaultValue;
    }

    function valueOrDefault(value, defaultValue) {
        return has(value) ? value : defaultValue;
    }

    return {
        has: has,
        valueOrDefault: valueOrDefault,
        merge: merge,
        extend: extend,
        clone: clone,
        get: get
    };
});

/*global define,console,document*/
define('scalejs/base.array',[
    './base.object'
], function (
    object
) {
    

    var valueOrDefault = object.valueOrDefault;

    function addOne(array, item) {
        /// <summary>
        /// Add an item to the array if it doesn't exist.
        /// </summary>
        /// <param name="array">Array to add the item to.</param>
        /// <param name="item">Item to add to the array.</param>
        if (array.indexOf(item) < 0) {
            array.push(item);
        }
    }

    function removeOne(array, item) {
        /// <summary>
        /// Remove the first occurence of an item from the given array.
        /// The identity operator === is used for the comparison.
        /// <param name="array">Array to remove the item from (in place).</param>
        /// <param name="item">The item to remove from the array.</param>
        var found = array.indexOf(item);
        if (found > -1) {
            array.splice(found, 1);
        }
    }

    function removeAll(array) {
        /// <summary>
        /// Remove all items from the array
        /// </summary>
        /// <param name="array">Array to remove items from (in place).</param>
        array.splice(0, array.length);
    }

    function copy(array, first, count) {
        /// <summary>
        /// Return the specified items of the array as a new array.
        /// </summary>
        /// <param name="array">Array to return items from.</param>
        /// <param name="first">Index of the first item to include into 
        /// the result array (0 if not specified).</param>
        /// <param name="count">Number of items to include into the result 
        /// array (length of the array if not specified).</param>
        /// <returns type="">New array containing the specified items.</returns>
        first = valueOrDefault(first, 0);
        count = valueOrDefault(count, array.length);
        return Array.prototype.slice.call(array, first, count);
    }

    function find(array, f, context) {
        var i,
            l;
        for (i = 0, l = array.length; i < l; i += 1) {
            if (array.hasOwnProperty(i) && f.call(context, array[i], i, array)) {
                return array[i];
            }
        }
        return null;
    }

    function toArray(list, start, end) {
        /*ignore jslint start*/
        var array = [],
            i,
            result;

        for (i = list.length; i--; array[i] = list[i]) {}
        
        result = copy(array, start, end);

        return result;
        /*ignore jslint end*/
    }

    return {
        addOne: addOne,
        removeOne: removeOne,
        removeAll: removeAll,
        copy: copy,
        find: find,
        toArray: toArray
    };
});

/*global define,window,document,console*/
define('scalejs/base.log',[
], function (
) {
    

    var logMethods = ['log', 'info', 'warn', 'error'],
        self = {};

    // Workaround for IE8 and IE9 - in these browsers console.log exists but it's not a real JS function.
    // See http://stackoverflow.com/a/5539378/201958 for more details

    if (window.console !== undefined) {
        if (typeof console.log === "object") {
            logMethods.forEach(function (method) {
                self[method] = this.bind(console[method], console);
            }, Function.prototype.call);
        } else {
            logMethods.forEach(function (method) {
                if (console[method]) {
                    self[method] = console[method].bind(console);
                } else {
                    self[method] = console.log.bind(console);
                }
            });
        }

        // debug in IE doesn't output arguments with index > 0 so use info instead
        self.debug = self.info;
    } else {
        logMethods.forEach(function (method) {
            self[method] = function () {};
        });
        logMethods.debug = function () {};
    }

    self.formatException = function (ex) {
        var stack = ex.stack ? String(ex.stack) : '',
            message = ex.message || '';
        return 'Error: ' + message + '\nStack: ' + stack;
    };

    return self;
});

/*
 * Minimal base implementation. 
 */
/*global define,console,document*/
define('scalejs/base',[
    './base.array',
    './base.log',
    './base.object',
    './base.type'
], function (
    array,
    log,
    object,
    type
) {
    

    return {
        type: type,
        object: object,
        array: array,
        log: log
    };
});

/*global define */
/// <reference path="../Scripts/es5-shim.js" />
define('scalejs/core',[
    './base'
], function (
    base
) {
    

    // Imports
    var has = base.object.has,
        is = base.type.is,
        extend = base.object.extend,
        addOne = base.array.addOne,
        error = base.log.error,
        self = {},
        extensions = [],
        applicationEventListeners = [],
        isApplicationRunning = false;

    function registerExtension(extension) {
        try {
            // If extension is a function then give it an instance of the core. 
            if (is(extension, 'function')) {
                var ext = extension(self);
                // Any result is an actual core extension so extend
                if (ext) {
                    extend(self, ext);
                    addOne(extensions, ext);
                }
                return;
            }
            // If extension has buildCore function then give it an instance of the core. 
            if (is(extension, 'buildCore', 'function')) {
                extension.buildCore(self);
                addOne(extensions, extension);
                return;
            }

            // If extension has `core` property then extend core with it.
            if (has(extension, 'core')) {
                extend(self, extension.core);
                addOne(extensions, extension);
                return;
            }

            // Otherwise extension core with the extension itself.
            extend(self, extension);
            addOne(extensions, extension);
        } catch (ex) {
            error('Fatal error during application initialization. ',
                    'Failed to build core with extension "',
                    extension,
                    'See following exception for more details.',
                    ex);
        }
    }


    function buildSandbox(id) {
        if (!has(id)) {
            throw new Error('Sandbox name is required to build a sandbox.');
        }

        // Create module instance specific sandbox 
        var sandbox = {
            type: self.type,
            object: self.object,
            array: self.array,
            log: self.log
        };


        // Add extensions to sandbox
        extensions.forEach(function (extension) {
            try {
                // If extension has buildSandbox method use it to build sandbox
                // Otherwise simply add extension to the sandbox at the specified path
                if (is(extension, 'buildSandbox', 'function')) {
                    extension.buildSandbox(sandbox);
                    return;
                }

                if (has(extension, 'sandbox')) {
                    extend(sandbox, extension.sandbox);
                    return;
                }

                extend(sandbox, extension);
            } catch (ex) {
                error('Fatal error during application initialization. ',
                      'Failed to build sandbox with extension "',
                      extension,
                      'See following exception for more details.',
                      ex);
                throw ex;
            }
        });

        return sandbox;
    }

    function onApplicationEvent(listener) {
        applicationEventListeners.push(listener);
    }

    function notifyApplicationStarted() {
        if (isApplicationRunning) { return; }

        isApplicationRunning = true;
        applicationEventListeners.forEach(function (listener) {
            listener('started');
        });
    }

    function notifyApplicationStopped() {
        if (!isApplicationRunning) { return; }

        isApplicationRunning = false;
        applicationEventListeners.forEach(function (listener) {
            listener('stopped');
        });
    }

    return extend(self, {
        type: base.type,
        object: base.object,
        array: base.array,
        log: base.log,
        buildSandbox: buildSandbox,
        notifyApplicationStarted: notifyApplicationStarted,
        notifyApplicationStopped: notifyApplicationStopped,
        onApplicationEvent: onApplicationEvent,
        isApplicationRunning: function () { return isApplicationRunning; },
        registerExtension: registerExtension
    });
});

/*

 * Core Application
 *
 * The Core Application manages the life cycle of modules.
 */
/*global define,window */
/*jslint nomen:true*/
define('scalejs/application',[
    'scalejs!core'
], function (
    core
) {
    

    var addOne = core.array.addOne,
        toArray = core.array.toArray,
        //has = core.object.has,
        error = core.log.error,
        debug = core.log.debug,
        moduleRegistrations = [],
        moduleInstances = [];

    function registerModules() {
        // Dynamic module loading is no longer supported for simplicity.
        // Module is free to load any of its resources dynamically.
        // Or an extension can provide dynamic module loading capabilities as needed.
        if (core.isApplicationRunning()) {
            throw new Error('Can\'t register module since the application is already running.',
                            'Dynamic module loading is not supported.');
        }

        Array.prototype.push.apply(moduleRegistrations, toArray(arguments).filter(function (m) { return m; }));
    }

    function createModule(module) {
        var moduleInstance,
            moduleId;

        if (typeof module === 'function') {
            try {
                moduleInstance = module();
            } catch (ex) {
                if (module.getId) {
                    moduleId = module.getId();
                } else {
                    moduleId = module.name;
                }

                error('Failed to create an instance of module "' + moduleId + '".',
                      'Application will continue running without the module. ' +
                      'See following exception stack for more details.',
                      ex.stack);
            }
        } else {
            moduleInstance = module;
        }

        addOne(moduleInstances, moduleInstance);

        return moduleInstance;
    }

    function createAll() {
        moduleRegistrations.forEach(createModule);
    }

    function startAll() {
        debug('Application started.');

        core.notifyApplicationStarted();
    }

    function run() {
        createAll();
        startAll();
    }

    function exit() {
        debug('Application exited.');
        core.notifyApplicationStopped();
    }

    return {
        registerModules: registerModules,
        run: run,
        exit: exit
    };
});

/**
 * @license RequireJS domReady 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/domReady for details
 */
/*jslint */
/*global require: false, define: false, requirejs: false,
  window: false, clearInterval: false, document: false,
  self: false, setInterval: false */


define('domReady',[],function () {
    

    var isTop, testDiv, scrollIntervalId,
        isBrowser = typeof window !== "undefined" && window.document,
        isPageLoaded = !isBrowser,
        doc = isBrowser ? document : null,
        readyCalls = [];

    function runCallbacks(callbacks) {
        var i;
        for (i = 0; i < callbacks.length; i += 1) {
            callbacks[i](doc);
        }
    }

    function callReady() {
        var callbacks = readyCalls;

        if (isPageLoaded) {
            //Call the DOM ready callbacks
            if (callbacks.length) {
                readyCalls = [];
                runCallbacks(callbacks);
            }
        }
    }

    /**
     * Sets the page as loaded.
     */
    function pageLoaded() {
        if (!isPageLoaded) {
            isPageLoaded = true;
            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);
            }

            callReady();
        }
    }

    if (isBrowser) {
        if (document.addEventListener) {
            //Standards. Hooray! Assumption here that if standards based,
            //it knows about DOMContentLoaded.
            document.addEventListener("DOMContentLoaded", pageLoaded, false);
            window.addEventListener("load", pageLoaded, false);
        } else if (window.attachEvent) {
            window.attachEvent("onload", pageLoaded);

            testDiv = document.createElement('div');
            try {
                isTop = window.frameElement === null;
            } catch (e) { }

            //DOMContentLoaded approximation that uses a doScroll, as found by
            //Diego Perini: http://javascript.nwbox.com/IEContentLoaded/,
            //but modified by other contributors, including jdalton
            if (testDiv.doScroll && isTop && window.external) {
                scrollIntervalId = setInterval(function () {
                    try {
                        testDiv.doScroll();
                        pageLoaded();
                    } catch (e) { }
                }, 30);
            }
        }

        //Check if document already complete, and if so, just trigger page load
        //listeners. Latest webkit browsers also use "interactive", and
        //will fire the onDOMContentLoaded before "interactive" but not after
        //entering "interactive" or "complete". More details:
        //http://dev.w3.org/html5/spec/the-end.html#the-end
        //http://stackoverflow.com/questions/3665561/document-readystate-of-interactive-vs-ondomcontentloaded
        //Hmm, this is more complicated on further use, see "firing too early"
        //bug: https://github.com/requirejs/domReady/issues/1
        //so removing the || document.readyState === "interactive" test.
        //There is still a window.onload binding that should get fired if
        //DOMContentLoaded is missed.
        if (document.readyState === "complete") {
            pageLoaded();
        }
    }

    /** START OF PUBLIC API **/

    /**
     * Registers a callback for DOM ready. If DOM is already ready, the
     * callback is called immediately.
     * @param {Function} callback
     */
    function domReady(callback) {
        if (isPageLoaded) {
            callback(doc);
        } else {
            readyCalls.push(callback);
        }
        return domReady;
    }

    domReady.version = '2.0.1';

    /**
     * Loader Plugin API method
     */
    domReady.load = function (name, req, onLoad, config) {
        if (config.isBuild) {
            onLoad(null);
        } else {
            domReady(onLoad);
        }
    };

    /** END OF PUBLIC API **/

    return domReady;
});


define('cssparser',[], function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"stylesheet":3,"charset":4,"space_cdata_list":5,"import_list":6,"namespace_list":7,"general_list":8,"CHARSET_SYM":9,"wempty":10,"STRING":11,";":12,"import_item":13,"import":14,"IMPORT_SYM":15,"string_or_uri":16,"media_query_list":17,"namespace_item":18,"namespace":19,"NAMESPACE_SYM":20,"namespace_prefix":21,"IDENT":22,"URI":23,"general_item":24,"null":25,"ruleset":26,"media":27,"page":28,"font_face":29,"keyframes":30,"MEDIA_SYM":31,"{":32,"}":33,"media_query":34,"media_combinator":35,"(":36,")":37,":":38,",":39,"whitespace":40,"expr":41,"string_term":42,"PAGE_SYM":43,"page_ident":44,"pseudo_page":45,"declaration_list":46,"FONT_FACE_SYM":47,"unary_operator":48,"-":49,"+":50,"property":51,"*":52,"selector_list":53,"selector":54,"simple_selector":55,"combinator":56,">":57,"simple_selector_atom_list":58,"element_name":59,"simple_selector_atom":60,"HASH":61,"class":62,"attrib":63,"pseudo":64,".":65,"[":66,"]":67,"attrib_operator":68,"attrib_value":69,"=":70,"INCLUDES":71,"DASHMATCH":72,"PREFIXMATCH":73,"SUFFIXMATCH":74,"SUBSTRINGMATCH":75,"FUNCTION":76,"declaration_parts":77,"declaration":78,"IMPORTANT_SYM":79,"term":80,"operator":81,"computable_term":82,"NUMBER":83,"PERCENTAGE":84,"LENGTH":85,"EMS":86,"EXS":87,"ANGLE":88,"TIME":89,"FREQ":90,"UNICODERANGE":91,"hexcolor":92,"/":93,"S":94,"space_cdata":95,"CDO":96,"CDC":97,"keyframe_symbol":98,"keyframe_list":99,"keyframe":100,"keyframe_offset_list":101,"keyframe_offset":102,"KEYFRAMES":103,"$accept":0,"$end":1},
terminals_: {2:"error",9:"CHARSET_SYM",11:"STRING",12:";",15:"IMPORT_SYM",20:"NAMESPACE_SYM",22:"IDENT",23:"URI",25:"null",31:"MEDIA_SYM",32:"{",33:"}",36:"(",37:")",38:":",39:",",43:"PAGE_SYM",47:"FONT_FACE_SYM",49:"-",50:"+",52:"*",57:">",61:"HASH",65:".",66:"[",67:"]",70:"=",71:"INCLUDES",72:"DASHMATCH",73:"PREFIXMATCH",74:"SUFFIXMATCH",75:"SUBSTRINGMATCH",76:"FUNCTION",79:"IMPORTANT_SYM",83:"NUMBER",84:"PERCENTAGE",85:"LENGTH",86:"EMS",87:"EXS",88:"ANGLE",89:"TIME",90:"FREQ",91:"UNICODERANGE",93:"/",94:"S",96:"CDO",97:"CDC",103:"KEYFRAMES"},
productions_: [0,[3,5],[4,5],[4,0],[6,1],[6,2],[6,0],[13,1],[13,1],[14,6],[7,1],[7,2],[7,0],[18,1],[18,1],[19,6],[21,2],[21,1],[16,2],[16,2],[8,1],[8,2],[8,1],[24,1],[24,1],[24,1],[24,1],[24,1],[24,1],[27,8],[17,1],[17,2],[17,3],[17,0],[35,2],[35,2],[35,2],[35,2],[35,1],[34,1],[34,1],[34,0],[28,10],[44,1],[44,0],[45,2],[45,0],[29,7],[48,1],[48,1],[51,2],[51,3],[26,6],[53,1],[53,4],[54,1],[54,3],[56,2],[56,2],[56,1],[56,0],[55,1],[55,2],[58,1],[58,2],[58,0],[60,1],[60,1],[60,1],[60,1],[62,2],[59,1],[59,1],[63,5],[63,9],[68,1],[68,1],[68,1],[68,1],[68,1],[68,1],[69,1],[69,1],[64,2],[64,6],[64,6],[64,3],[46,1],[46,2],[77,1],[77,1],[77,1],[78,5],[78,6],[78,0],[41,1],[41,3],[41,2],[80,1],[80,2],[80,1],[82,2],[82,2],[82,2],[82,2],[82,2],[82,2],[82,2],[82,2],[82,5],[42,2],[42,2],[42,2],[42,2],[42,1],[81,2],[81,2],[81,2],[81,0],[92,2],[40,1],[40,2],[10,1],[10,0],[5,1],[5,2],[5,0],[95,1],[95,1],[95,1],[30,8],[99,1],[99,2],[99,0],[100,6],[101,2],[101,4],[102,1],[102,1],[102,1],[98,2]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
  		this.$ = {};
  		if ( $$[$0-4] )
  		  	this.$["charset"]	= $$[$0-4];
  		if ( $$[$0-2] )
  			this.$["imports"]	= $$[$0-2];
  		if ( $$[$0-1] )
  			this.$["namespaces"]	= $$[$0-1];
  		if ( $$[$0] )
  			this.$["rulelist"]	= $$[$0];

  		return this.$;
  	
break;
case 2:this.$ = $$[$0-2];
break;
case 3:this.$ = "";
break;
case 4:
  		this.$ = [];
  		if ( $$[$0] !== null )
  			this.$.push ( $$[$0] );
  	
break;
case 5:
  		this.$ = $$[$0-1];
  		if ( $$[$0] !== null )
  			this.$.push ( $$[$0] );
  	
break;
case 6:this.$ = null;
break;
case 7:this.$ = $$[$0];
break;
case 8:this.$ = null;
break;
case 9:
  		this.$ = {
  			"import": $$[$0-3]
  		};

  		if ( $$[$0-2] != null )
	  		this.$[ "mediaqueries" ] = $$[$0-2];
  	
break;
case 10:
  		this.$ = [];
  		if ( $$[$0] !== null )
  			this.$.push ( $$[$0] );
  	
break;
case 11:
  		this.$ = $$[$0-1];
  		if ( $$[$0] !== null )
  			this.$.push ( $$[$0] );
  	
break;
case 12:this.$ = null;
break;
case 13:this.$ = $$[$0];
break;
case 14:this.$ = null;
break;
case 15:
  		this.$ = {
  			"namespace": $$[$0-2]
  		};
  		
  		if ( $$[$0-3] )
	  		this.$["prefix"] = $$[$0-3];
  	
break;
case 16:this.$ = $$[$0-1];
break;
case 17:this.$ = null;
break;
case 18:this.$ = $$[$0-1];
break;
case 19:this.$ = $$[$0-1];
break;
case 20:
  		this.$ = [];
  		if ( $$[$0] !== null )
  			this.$.push ( $$[$0] );
  	
break;
case 21:
  		this.$ = $$[$0-1];
  		this.$.push( $$[$0] );
  	
break;
case 23:this.$ = $$[$0];
break;
case 24:this.$ = $$[$0];
break;
case 25:this.$ = $$[$0];
break;
case 26:this.$ = $$[$0];
break;
case 27:this.$ = $$[$0];
break;
case 28:this.$ = null;
break;
case 29:this.$ = { "type": "media", "mediaqueries" : $$[$0-5], "children": $$[$0-2] };
break;
case 30:this.$ = $$[$0];
break;
case 31:this.$ = $$[$0-1] + ' ' + $$[$0];
break;
case 32:this.$ = $$[$0-2] + $$[$0-1] + $$[$0];
break;
case 33:this.$ = null;
break;
case 34:this.$ = ' ' + $$[$0-1]				/* cwdoh; for beatify */;
break;
case 35:this.$ = $$[$0-1];
break;
case 36:this.$ = $$[$0-1];
break;
case 37:this.$ = ", ";
break;
case 38:this.$ = ' ';
break;
case 39:this.$ = $$[$0];
break;
case 40:this.$ = $$[$0];
break;
case 41:this.$ = "";
break;
case 42:this.$ =	{ "id": $$[$0-7], "pseudo": $$[$0-6], "declarations": $$[$0-2] };
break;
case 43:this.$ = $$[$0];
break;
case 44:this.$ = "";
break;
case 45:this.$ = $$[$0-1] + $$[$0];
break;
case 46:this.$ = "";
break;
case 47:this.$ = { "type": "fontface", "declarations": $$[$0-2] };
break;
case 48:this.$ = $$[$0];
break;
case 49:this.$ = $$[$0];
break;
case 50:this.$ = $$[$0-1];
break;
case 51:this.$ = $$[$0-2] + $$[$0-1]			/* cwdoh; */;
break;
case 52:this.$ = { "type": "style", "selector": $$[$0-5], "declarations": $$[$0-2] };
break;
case 53:this.$ = $$[$0];
break;
case 54:this.$ = $$[$0-3] + $$[$0-2] + ' ' + $$[$0];
break;
case 55:this.$ = $$[$0];
break;
case 56:this.$ = $$[$0-2] + $$[$0-1] + $$[$0];
break;
case 57:this.$ = $$[$0-1];
break;
case 58:this.$ = $$[$0-1];
break;
case 59:this.$ = $$[$0];
break;
case 60:this.$ = "";
break;
case 61:this.$ = $$[$0];
break;
case 62:this.$ = $$[$0-1] + $$[$0];
break;
case 63:this.$ = $$[$0];
break;
case 64:this.$ = $$[$0-1] + $$[$0];
break;
case 65:this.$ = "";
break;
case 66:this.$ = $$[$0];
break;
case 67:this.$ = $$[$0];
break;
case 68:this.$ = $$[$0];
break;
case 69:this.$ = $$[$0];
break;
case 70:this.$ = $$[$0-1] + $$[$0];
break;
case 71:this.$ = $$[$0];
break;
case 72:this.$ = $$[$0];
break;
case 73:this.$ = $$[$0-4] + $$[$0-2] + $$[$0];
break;
case 74:this.$ = $$[$0-8] + $$[$0-6] + $$[$0-4] + $$[$0-3] + $$[$0-2] + $$[$0];
break;
case 75:this.$ = $$[$0];
break;
case 76:this.$ = $$[$0];
break;
case 77:this.$ = $$[$0];
break;
case 78:this.$ = $$[$0];
break;
case 79:this.$ = $$[$0];
break;
case 80:this.$ = $$[$0];
break;
case 81:this.$ = $$[$0];
break;
case 82:this.$ = $$[$0];
break;
case 83:this.$ = $$[$0-1] + $$[$0];
break;
case 84:this.$ = $$[$0-5] + $$[$0-4] + $$[$0-2] + $$[$0];
break;
case 85:this.$ = $$[$0-5] + $$[$0-4] + $$[$0-2] + $$[$0]		/* cwdoh; modern browsers allow attrib in pseudo function? */;
break;
case 86:this.$ = $$[$0-2] + $$[$0-1] + $$[$0]				/* cwdoh; is "::" moz extension? */;
break;
case 87:
  		this.$ = {};
  		if ( $$[$0] !== null ) {
  			this.$[ $$[$0][0] ] = $$[$0][1];
  		}
  	
break;
case 88:
  		this.$ = $$[$0-1];
  		if ( $$[$0] !== null ) {
	  		this.$[ $$[$0][0] ] = $$[$0][1];
	  	}
  	
break;
case 89:this.$ = $$[$0];
break;
case 90:this.$ = null;
break;
case 91:this.$ = null;
break;
case 92:this.$ = [ $$[$0-4], $$[$0-1] ];
break;
case 93:this.$ = [ $$[$0-5], $$[$0-2] + " !important" ];
break;
case 94:this.$ = null;
break;
case 95:this.$ = $$[$0];
break;
case 96:this.$ = $$[$0-2] + $$[$0-1] + $$[$0];
break;
case 97:this.$ = $$[$0-1] + ' ' + $$[$0];
break;
case 98:this.$ = $$[$0];
break;
case 99:this.$ = $$[$0-1] + $$[$0];
break;
case 100:this.$ = $$[$0];
break;
case 101:this.$ = $$[$0-1];
break;
case 102:this.$ = $$[$0-1];
break;
case 103:this.$ = $$[$0-1];
break;
case 104:this.$ = $$[$0-1];
break;
case 105:this.$ = $$[$0-1];
break;
case 106:this.$ = $$[$0-1];
break;
case 107:this.$ = $$[$0-1];
break;
case 108:this.$ = $$[$0-1];
break;
case 109:this.$ = $$[$0-4] + $$[$0-2] + $$[$0-1];
break;
case 110:this.$ = $$[$0-1];
break;
case 111:this.$ = $$[$0-1];
break;
case 112:this.$ = $$[$0-1];
break;
case 113:this.$ = $$[$0-1];
break;
case 114:this.$ = $$[$0];
break;
case 115:this.$ = $$[$0-1];
break;
case 116:this.$ = $$[$0-1];
break;
case 117:this.$ = $$[$0-1];
break;
case 118:this.$ = "";
break;
case 119:this.$ = $$[$0-1];
break;
case 120:this.$ = ' ';
break;
case 121:this.$ = ' ';
break;
case 122:this.$ = $$[$0];
break;
case 123:this.$ = "";
break;
case 124:this.$ = null;
break;
case 125:this.$ = null;
break;
case 127:this.$ = null;
break;
case 128:this.$ = null;
break;
case 129:this.$ = null;
break;
case 130:this.$ = { "type": "keyframes", "id": $$[$0-6],	"keyframes": $$[$0-2], "prefix": $$[$0-7] };
break;
case 131:this.$ = [ $$[$0] ];
break;
case 132:
  		this.$ = $$[$0-1];
  		this.$.push( $$[$0] );
  	
break;
case 133:this.$ = [];
break;
case 134:this.$ = { "type": "keyframe", "offset": $$[$0-5], "declarations": $$[$0-2] };
break;
case 135:this.$ = $$[$0-1];
break;
case 136:this.$ = $$[$0-3] + ", " + $$[$0-2];
break;
case 137:this.$ = $$[$0];
break;
case 138:this.$ = $$[$0];
break;
case 139:this.$ = $$[$0];
break;
case 140:this.$ = $$[$0-1].split( new RegExp("@([-a-zA-Z0-9]*)keyframes", "g") )[1]		/* only prefix */;
break;
}
},
table: [{1:[2,3],3:1,4:2,9:[1,3],15:[2,3],20:[2,3],22:[2,3],25:[2,3],31:[2,3],32:[2,3],38:[2,3],39:[2,3],43:[2,3],47:[2,3],50:[2,3],52:[2,3],57:[2,3],61:[2,3],65:[2,3],66:[2,3],94:[2,3],96:[2,3],97:[2,3],103:[2,3]},{1:[3]},{1:[2,126],5:4,15:[2,126],20:[2,126],22:[2,126],25:[2,126],31:[2,126],32:[2,126],38:[2,126],39:[2,126],43:[2,126],47:[2,126],50:[2,126],52:[2,126],57:[2,126],61:[2,126],65:[2,126],66:[2,126],94:[1,6],95:5,96:[1,7],97:[1,8],103:[2,126]},{10:9,11:[2,123],40:10,94:[1,11]},{1:[2,6],5:16,6:12,13:14,14:15,15:[1,17],20:[2,6],22:[2,6],25:[2,6],31:[2,6],32:[2,6],38:[2,6],39:[2,6],43:[2,6],47:[2,6],50:[2,6],52:[2,6],57:[2,6],61:[2,6],65:[2,6],66:[2,6],94:[1,6],95:13,96:[1,7],97:[1,8],103:[2,6]},{1:[2,124],15:[2,124],20:[2,124],22:[2,124],25:[2,124],31:[2,124],32:[2,124],33:[2,124],38:[2,124],39:[2,124],43:[2,124],47:[2,124],50:[2,124],52:[2,124],57:[2,124],61:[2,124],65:[2,124],66:[2,124],94:[2,124],96:[2,124],97:[2,124],103:[2,124]},{1:[2,127],15:[2,127],20:[2,127],22:[2,127],25:[2,127],31:[2,127],32:[2,127],33:[2,127],38:[2,127],39:[2,127],43:[2,127],47:[2,127],50:[2,127],52:[2,127],57:[2,127],61:[2,127],65:[2,127],66:[2,127],94:[2,127],96:[2,127],97:[2,127],103:[2,127]},{1:[2,128],15:[2,128],20:[2,128],22:[2,128],25:[2,128],31:[2,128],32:[2,128],33:[2,128],38:[2,128],39:[2,128],43:[2,128],47:[2,128],50:[2,128],52:[2,128],57:[2,128],61:[2,128],65:[2,128],66:[2,128],94:[2,128],96:[2,128],97:[2,128],103:[2,128]},{1:[2,129],15:[2,129],20:[2,129],22:[2,129],25:[2,129],31:[2,129],32:[2,129],33:[2,129],38:[2,129],39:[2,129],43:[2,129],47:[2,129],50:[2,129],52:[2,129],57:[2,129],61:[2,129],65:[2,129],66:[2,129],94:[2,129],96:[2,129],97:[2,129],103:[2,129]},{11:[1,18]},{1:[2,122],11:[2,122],12:[2,122],15:[2,122],20:[2,122],22:[2,122],23:[2,122],25:[2,122],31:[2,122],32:[2,122],33:[2,122],36:[2,122],37:[2,122],38:[2,122],39:[2,122],43:[2,122],47:[2,122],49:[2,122],50:[2,122],52:[2,122],57:[2,122],61:[2,122],65:[2,122],66:[2,122],67:[2,122],70:[2,122],71:[2,122],72:[2,122],73:[2,122],74:[2,122],75:[2,122],76:[2,122],79:[2,122],83:[2,122],84:[2,122],85:[2,122],86:[2,122],87:[2,122],88:[2,122],89:[2,122],90:[2,122],91:[2,122],93:[2,122],94:[1,19],96:[2,122],97:[2,122],103:[2,122]},{1:[2,120],11:[2,120],12:[2,120],15:[2,120],20:[2,120],22:[2,120],23:[2,120],25:[2,120],31:[2,120],32:[2,120],33:[2,120],36:[2,120],37:[2,120],38:[2,120],39:[2,120],43:[2,120],47:[2,120],49:[2,120],50:[2,120],52:[2,120],57:[2,120],61:[2,120],65:[2,120],66:[2,120],67:[2,120],70:[2,120],71:[2,120],72:[2,120],73:[2,120],74:[2,120],75:[2,120],76:[2,120],79:[2,120],83:[2,120],84:[2,120],85:[2,120],86:[2,120],87:[2,120],88:[2,120],89:[2,120],90:[2,120],91:[2,120],93:[2,120],94:[2,120],96:[2,120],97:[2,120],103:[2,120]},{1:[2,12],5:23,7:20,13:21,14:15,15:[1,17],18:22,19:24,20:[1,25],22:[2,12],25:[2,12],31:[2,12],32:[2,12],38:[2,12],39:[2,12],43:[2,12],47:[2,12],50:[2,12],52:[2,12],57:[2,12],61:[2,12],65:[2,12],66:[2,12],94:[1,6],95:5,96:[1,7],97:[1,8],103:[2,12]},{1:[2,125],15:[2,125],20:[2,125],22:[2,125],25:[2,125],31:[2,125],32:[2,125],38:[2,125],39:[2,125],43:[2,125],47:[2,125],50:[2,125],52:[2,125],57:[2,125],61:[2,125],65:[2,125],66:[2,125],94:[2,125],96:[2,125],97:[2,125],103:[2,125]},{1:[2,4],15:[2,4],20:[2,4],22:[2,4],25:[2,4],31:[2,4],32:[2,4],38:[2,4],39:[2,4],43:[2,4],47:[2,4],50:[2,4],52:[2,4],57:[2,4],61:[2,4],65:[2,4],66:[2,4],94:[2,4],96:[2,4],97:[2,4],103:[2,4]},{1:[2,7],15:[2,7],20:[2,7],22:[2,7],25:[2,7],31:[2,7],32:[2,7],38:[2,7],39:[2,7],43:[2,7],47:[2,7],50:[2,7],52:[2,7],57:[2,7],61:[2,7],65:[2,7],66:[2,7],94:[2,7],96:[2,7],97:[2,7],103:[2,7]},{1:[2,8],15:[2,8],20:[2,8],22:[2,8],25:[2,8],31:[2,8],32:[2,8],38:[2,8],39:[2,8],43:[2,8],47:[2,8],50:[2,8],52:[2,8],57:[2,8],61:[2,8],65:[2,8],66:[2,8],94:[1,6],95:26,96:[1,7],97:[1,8],103:[2,8]},{10:27,11:[2,123],23:[2,123],40:10,94:[1,11]},{10:28,12:[2,123],40:10,94:[1,11]},{1:[2,121],11:[2,121],12:[2,121],15:[2,121],20:[2,121],22:[2,121],23:[2,121],25:[2,121],31:[2,121],32:[2,121],33:[2,121],36:[2,121],37:[2,121],38:[2,121],39:[2,121],43:[2,121],47:[2,121],49:[2,121],50:[2,121],52:[2,121],57:[2,121],61:[2,121],65:[2,121],66:[2,121],67:[2,121],70:[2,121],71:[2,121],72:[2,121],73:[2,121],74:[2,121],75:[2,121],76:[2,121],79:[2,121],83:[2,121],84:[2,121],85:[2,121],86:[2,121],87:[2,121],88:[2,121],89:[2,121],90:[2,121],91:[2,121],93:[2,121],94:[2,121],96:[2,121],97:[2,121],103:[2,121]},{1:[2,126],5:33,8:29,18:30,19:24,20:[1,25],22:[1,50],24:31,25:[1,32],26:34,27:35,28:36,29:37,30:38,31:[1,40],32:[2,126],38:[1,58],39:[2,126],43:[1,41],47:[1,42],50:[2,126],52:[1,51],53:39,54:44,55:46,57:[2,126],58:47,59:48,60:49,61:[1,52],62:53,63:54,64:55,65:[1,56],66:[1,57],94:[1,6],95:5,96:[1,7],97:[1,8],98:43,103:[1,45]},{1:[2,5],15:[2,5],20:[2,5],22:[2,5],25:[2,5],31:[2,5],32:[2,5],38:[2,5],39:[2,5],43:[2,5],47:[2,5],50:[2,5],52:[2,5],57:[2,5],61:[2,5],65:[2,5],66:[2,5],94:[2,5],96:[2,5],97:[2,5],103:[2,5]},{1:[2,10],20:[2,10],22:[2,10],25:[2,10],31:[2,10],32:[2,10],38:[2,10],39:[2,10],43:[2,10],47:[2,10],50:[2,10],52:[2,10],57:[2,10],61:[2,10],65:[2,10],66:[2,10],94:[2,10],96:[2,10],97:[2,10],103:[2,10]},{1:[2,8],15:[2,8],20:[2,8],22:[2,8],25:[2,8],31:[2,8],32:[2,8],38:[2,8],39:[2,8],43:[2,8],47:[2,8],50:[2,8],52:[2,8],57:[2,8],61:[2,8],65:[2,8],66:[2,8],94:[1,6],95:26,96:[1,7],97:[1,8],103:[2,8]},{1:[2,13],20:[2,13],22:[2,13],25:[2,13],31:[2,13],32:[2,13],38:[2,13],39:[2,13],43:[2,13],47:[2,13],50:[2,13],52:[2,13],57:[2,13],61:[2,13],65:[2,13],66:[2,13],94:[2,13],96:[2,13],97:[2,13],103:[2,13]},{10:59,11:[2,123],22:[2,123],23:[2,123],40:10,94:[1,11]},{1:[2,125],15:[2,125],20:[2,125],22:[2,125],25:[2,125],31:[2,125],32:[2,125],33:[2,125],38:[2,125],39:[2,125],43:[2,125],47:[2,125],50:[2,125],52:[2,125],57:[2,125],61:[2,125],65:[2,125],66:[2,125],94:[2,125],96:[2,125],97:[2,125],103:[2,125]},{11:[1,61],16:60,23:[1,62]},{12:[1,63]},{1:[2,1],5:65,22:[1,50],24:64,26:34,27:35,28:36,29:37,30:38,31:[1,40],32:[2,126],38:[1,58],39:[2,126],43:[1,41],47:[1,42],50:[2,126],52:[1,51],53:39,54:44,55:46,57:[2,126],58:47,59:48,60:49,61:[1,52],62:53,63:54,64:55,65:[1,56],66:[1,57],94:[1,6],95:5,96:[1,7],97:[1,8],98:43,103:[1,45]},{1:[2,11],20:[2,11],22:[2,11],25:[2,11],31:[2,11],32:[2,11],38:[2,11],39:[2,11],43:[2,11],47:[2,11],50:[2,11],52:[2,11],57:[2,11],61:[2,11],65:[2,11],66:[2,11],94:[2,11],96:[2,11],97:[2,11],103:[2,11]},{1:[2,20],22:[2,20],31:[2,20],32:[2,20],33:[2,20],38:[2,20],39:[2,20],43:[2,20],47:[2,20],50:[2,20],52:[2,20],57:[2,20],61:[2,20],65:[2,20],66:[2,20],94:[2,20],96:[2,20],97:[2,20],103:[2,20]},{1:[2,22],22:[2,22],31:[2,22],32:[2,22],33:[2,22],38:[2,22],39:[2,22],43:[2,22],47:[2,22],50:[2,22],52:[2,22],57:[2,22],61:[2,22],65:[2,22],66:[2,22],94:[2,22],96:[2,22],97:[2,22],103:[2,22]},{1:[2,14],20:[2,14],22:[2,14],25:[2,14],31:[2,14],32:[2,14],38:[2,14],39:[2,14],43:[2,14],47:[2,14],50:[2,14],52:[2,14],57:[2,14],61:[2,14],65:[2,14],66:[2,14],94:[1,6],95:26,96:[1,7],97:[1,8],103:[2,14]},{1:[2,23],22:[2,23],31:[2,23],32:[2,23],33:[2,23],38:[2,23],39:[2,23],43:[2,23],47:[2,23],50:[2,23],52:[2,23],57:[2,23],61:[2,23],65:[2,23],66:[2,23],94:[2,23],96:[2,23],97:[2,23],103:[2,23]},{1:[2,24],22:[2,24],31:[2,24],32:[2,24],33:[2,24],38:[2,24],39:[2,24],43:[2,24],47:[2,24],50:[2,24],52:[2,24],57:[2,24],61:[2,24],65:[2,24],66:[2,24],94:[2,24],96:[2,24],97:[2,24],103:[2,24]},{1:[2,25],22:[2,25],31:[2,25],32:[2,25],33:[2,25],38:[2,25],39:[2,25],43:[2,25],47:[2,25],50:[2,25],52:[2,25],57:[2,25],61:[2,25],65:[2,25],66:[2,25],94:[2,25],96:[2,25],97:[2,25],103:[2,25]},{1:[2,26],22:[2,26],31:[2,26],32:[2,26],33:[2,26],38:[2,26],39:[2,26],43:[2,26],47:[2,26],50:[2,26],52:[2,26],57:[2,26],61:[2,26],65:[2,26],66:[2,26],94:[2,26],96:[2,26],97:[2,26],103:[2,26]},{1:[2,27],22:[2,27],31:[2,27],32:[2,27],33:[2,27],38:[2,27],39:[2,27],43:[2,27],47:[2,27],50:[2,27],52:[2,27],57:[2,27],61:[2,27],65:[2,27],66:[2,27],94:[2,27],96:[2,27],97:[2,27],103:[2,27]},{32:[1,66],39:[1,67]},{10:68,11:[2,123],22:[2,123],23:[2,123],32:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],61:[2,123],76:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],94:[1,11]},{10:69,22:[2,123],32:[2,123],38:[2,123],40:10,94:[1,11]},{10:70,32:[2,123],40:10,94:[1,11]},{22:[1,71]},{22:[2,60],32:[2,53],38:[2,60],39:[2,53],40:75,50:[1,73],52:[2,60],56:72,57:[1,74],61:[2,60],65:[2,60],66:[2,60],94:[1,11]},{10:76,22:[2,123],40:10,94:[1,11]},{22:[2,55],32:[2,55],38:[2,55],39:[2,55],50:[2,55],52:[2,55],57:[2,55],61:[2,55],65:[2,55],66:[2,55],94:[2,55]},{22:[2,61],32:[2,61],38:[1,58],39:[2,61],50:[2,61],52:[2,61],57:[2,61],60:77,61:[1,52],62:53,63:54,64:55,65:[1,56],66:[1,57],94:[2,61]},{22:[2,65],32:[2,65],38:[1,58],39:[2,65],50:[2,65],52:[2,65],57:[2,65],58:78,60:49,61:[1,52],62:53,63:54,64:55,65:[1,56],66:[1,57],94:[2,65]},{22:[2,63],32:[2,63],38:[2,63],39:[2,63],50:[2,63],52:[2,63],57:[2,63],61:[2,63],65:[2,63],66:[2,63],94:[2,63]},{22:[2,71],32:[2,71],38:[2,71],39:[2,71],50:[2,71],52:[2,71],57:[2,71],61:[2,71],65:[2,71],66:[2,71],94:[2,71]},{22:[2,72],32:[2,72],38:[2,72],39:[2,72],50:[2,72],52:[2,72],57:[2,72],61:[2,72],65:[2,72],66:[2,72],94:[2,72]},{22:[2,66],32:[2,66],38:[2,66],39:[2,66],50:[2,66],52:[2,66],57:[2,66],61:[2,66],65:[2,66],66:[2,66],94:[2,66]},{22:[2,67],32:[2,67],38:[2,67],39:[2,67],50:[2,67],52:[2,67],57:[2,67],61:[2,67],65:[2,67],66:[2,67],94:[2,67]},{22:[2,68],32:[2,68],38:[2,68],39:[2,68],50:[2,68],52:[2,68],57:[2,68],61:[2,68],65:[2,68],66:[2,68],94:[2,68]},{22:[2,69],32:[2,69],38:[2,69],39:[2,69],50:[2,69],52:[2,69],57:[2,69],61:[2,69],65:[2,69],66:[2,69],94:[2,69]},{22:[1,79]},{10:80,22:[2,123],40:10,94:[1,11]},{22:[1,81],38:[1,83],76:[1,82]},{10:86,11:[2,123],21:84,22:[1,85],23:[2,123],40:10,94:[1,11]},{11:[1,92],12:[2,33],17:87,22:[1,93],23:[1,94],34:88,36:[2,33],37:[2,33],38:[2,33],39:[2,33],41:89,42:90,48:98,49:[1,109],50:[1,110],61:[1,99],76:[1,108],80:91,82:97,83:[1,100],84:[1,101],85:[1,102],86:[1,103],87:[1,104],88:[1,105],89:[1,106],90:[1,107],91:[1,95],92:96,94:[2,33]},{10:111,11:[2,123],12:[2,123],22:[2,123],23:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],61:[2,123],76:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],94:[1,11]},{10:112,11:[2,123],12:[2,123],22:[2,123],23:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],61:[2,123],76:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],94:[1,11]},{1:[2,2],15:[2,2],20:[2,2],22:[2,2],25:[2,2],31:[2,2],32:[2,2],38:[2,2],39:[2,2],43:[2,2],47:[2,2],50:[2,2],52:[2,2],57:[2,2],61:[2,2],65:[2,2],66:[2,2],94:[2,2],96:[2,2],97:[2,2],103:[2,2]},{1:[2,21],22:[2,21],31:[2,21],32:[2,21],33:[2,21],38:[2,21],39:[2,21],43:[2,21],47:[2,21],50:[2,21],52:[2,21],57:[2,21],61:[2,21],65:[2,21],66:[2,21],94:[2,21],96:[2,21],97:[2,21],103:[2,21]},{1:[2,28],22:[2,28],31:[2,28],32:[2,28],33:[2,28],38:[2,28],39:[2,28],43:[2,28],47:[2,28],50:[2,28],52:[2,28],57:[2,28],61:[2,28],65:[2,28],66:[2,28],94:[1,6],95:26,96:[1,7],97:[1,8],103:[2,28]},{10:113,12:[2,123],22:[2,123],33:[2,123],40:10,52:[2,123],94:[1,11]},{10:114,22:[2,123],32:[2,123],38:[2,123],39:[2,123],40:10,50:[2,123],52:[2,123],57:[2,123],61:[2,123],65:[2,123],66:[2,123],94:[1,11]},{11:[1,92],17:115,22:[1,93],23:[1,94],32:[2,33],34:88,36:[2,33],37:[2,33],38:[2,33],39:[2,33],41:89,42:90,48:98,49:[1,109],50:[1,110],61:[1,99],76:[1,108],80:91,82:97,83:[1,100],84:[1,101],85:[1,102],86:[1,103],87:[1,104],88:[1,105],89:[1,106],90:[1,107],91:[1,95],92:96,94:[2,33]},{22:[1,117],32:[2,44],38:[2,44],44:116,94:[2,44]},{32:[1,118]},{10:119,32:[2,123],40:10,94:[1,11]},{22:[1,50],32:[2,65],38:[1,58],39:[2,65],50:[2,65],52:[1,51],55:120,57:[2,65],58:47,59:48,60:49,61:[1,52],62:53,63:54,64:55,65:[1,56],66:[1,57],94:[2,65]},{10:121,22:[2,123],32:[2,123],38:[2,123],39:[2,123],40:10,50:[2,123],52:[2,123],57:[2,123],61:[2,123],65:[2,123],66:[2,123],94:[1,11]},{10:122,22:[2,123],32:[2,123],38:[2,123],39:[2,123],40:10,50:[2,123],52:[2,123],57:[2,123],61:[2,123],65:[2,123],66:[2,123],94:[1,11]},{22:[2,59],32:[2,59],38:[2,59],39:[2,59],50:[2,59],52:[2,59],57:[2,59],61:[2,59],65:[2,59],66:[2,59],94:[1,19]},{22:[2,140]},{22:[2,64],32:[2,64],38:[2,64],39:[2,64],50:[2,64],52:[2,64],57:[2,64],61:[2,64],65:[2,64],66:[2,64],94:[2,64]},{22:[2,62],32:[2,62],38:[1,58],39:[2,62],50:[2,62],52:[2,62],57:[2,62],60:77,61:[1,52],62:53,63:54,64:55,65:[1,56],66:[1,57],94:[2,62]},{22:[2,70],32:[2,70],38:[2,70],39:[2,70],50:[2,70],52:[2,70],57:[2,70],61:[2,70],65:[2,70],66:[2,70],94:[2,70]},{22:[1,123]},{22:[2,83],32:[2,83],38:[2,83],39:[2,83],50:[2,83],52:[2,83],57:[2,83],61:[2,83],65:[2,83],66:[2,83],94:[2,83]},{10:124,22:[2,123],40:10,66:[2,123],94:[1,11]},{22:[1,125]},{11:[1,61],16:126,23:[1,62]},{10:127,11:[2,123],23:[2,123],40:10,94:[1,11]},{11:[2,17],23:[2,17]},{11:[1,92],12:[1,128],22:[1,93],23:[1,94],34:129,35:130,36:[1,131],37:[1,132],38:[1,133],39:[1,134],40:135,41:89,42:90,48:98,49:[1,109],50:[1,110],61:[1,99],76:[1,108],80:91,82:97,83:[1,100],84:[1,101],85:[1,102],86:[1,103],87:[1,104],88:[1,105],89:[1,106],90:[1,107],91:[1,95],92:96,94:[1,11]},{11:[2,30],12:[2,30],22:[2,30],23:[2,30],32:[2,30],36:[2,30],37:[2,30],38:[2,30],39:[2,30],49:[2,30],50:[2,30],61:[2,30],76:[2,30],83:[2,30],84:[2,30],85:[2,30],86:[2,30],87:[2,30],88:[2,30],89:[2,30],90:[2,30],91:[2,30],94:[2,30]},{11:[1,92],12:[2,39],22:[1,93],23:[1,94],32:[2,39],36:[2,39],37:[2,39],38:[2,39],39:[1,139],42:141,48:98,49:[1,109],50:[1,110],61:[1,99],70:[1,140],76:[1,108],80:137,81:136,82:97,83:[1,100],84:[1,101],85:[1,102],86:[1,103],87:[1,104],88:[1,105],89:[1,106],90:[1,107],91:[1,95],92:96,93:[1,138],94:[2,39]},{11:[2,40],12:[2,40],22:[2,40],23:[2,40],32:[2,40],36:[2,40],37:[2,40],38:[2,40],39:[2,40],49:[2,40],50:[2,40],61:[2,40],70:[2,40],76:[2,40],83:[2,40],84:[2,40],85:[2,40],86:[2,40],87:[2,40],88:[2,40],89:[2,40],90:[2,40],91:[2,40],93:[2,40],94:[2,40]},{11:[2,95],12:[2,95],22:[2,95],23:[2,95],32:[2,95],33:[2,95],36:[2,95],37:[2,95],38:[2,95],39:[2,95],49:[2,95],50:[2,95],52:[2,95],61:[2,95],70:[2,95],76:[2,95],79:[2,95],83:[2,95],84:[2,95],85:[2,95],86:[2,95],87:[2,95],88:[2,95],89:[2,95],90:[2,95],91:[2,95],93:[2,95],94:[2,95]},{10:142,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{10:143,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{10:144,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{10:145,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{11:[2,114],12:[2,114],22:[2,114],23:[2,114],32:[2,114],33:[2,114],36:[2,114],37:[2,114],38:[2,114],39:[2,114],49:[2,114],50:[2,114],52:[2,114],61:[2,114],70:[2,114],76:[2,114],79:[2,114],83:[2,114],84:[2,114],85:[2,114],86:[2,114],87:[2,114],88:[2,114],89:[2,114],90:[2,114],91:[2,114],93:[2,114],94:[2,114]},{11:[2,98],12:[2,98],22:[2,98],23:[2,98],32:[2,98],33:[2,98],36:[2,98],37:[2,98],38:[2,98],39:[2,98],49:[2,98],50:[2,98],52:[2,98],61:[2,98],70:[2,98],76:[2,98],79:[2,98],83:[2,98],84:[2,98],85:[2,98],86:[2,98],87:[2,98],88:[2,98],89:[2,98],90:[2,98],91:[2,98],93:[2,98],94:[2,98]},{76:[1,108],82:146,83:[1,100],84:[1,101],85:[1,102],86:[1,103],87:[1,104],88:[1,105],89:[1,106],90:[1,107]},{10:147,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{10:148,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{10:149,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{10:150,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{10:151,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{10:152,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{10:153,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{10:154,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{10:155,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{10:156,11:[2,123],22:[2,123],23:[2,123],40:10,49:[2,123],50:[2,123],61:[2,123],76:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],94:[1,11]},{76:[2,48],83:[2,48],84:[2,48],85:[2,48],86:[2,48],87:[2,48],88:[2,48],89:[2,48],90:[2,48]},{76:[2,49],83:[2,49],84:[2,49],85:[2,49],86:[2,49],87:[2,49],88:[2,49],89:[2,49],90:[2,49]},{11:[2,18],12:[2,18],22:[2,18],23:[2,18],36:[2,18],37:[2,18],38:[2,18],39:[2,18],49:[2,18],50:[2,18],61:[2,18],76:[2,18],83:[2,18],84:[2,18],85:[2,18],86:[2,18],87:[2,18],88:[2,18],89:[2,18],90:[2,18],91:[2,18],94:[2,18]},{11:[2,19],12:[2,19],22:[2,19],23:[2,19],36:[2,19],37:[2,19],38:[2,19],39:[2,19],49:[2,19],50:[2,19],61:[2,19],76:[2,19],83:[2,19],84:[2,19],85:[2,19],86:[2,19],87:[2,19],88:[2,19],89:[2,19],90:[2,19],91:[2,19],94:[2,19]},{10:161,12:[1,160],22:[1,163],33:[2,94],40:10,46:157,51:162,52:[1,164],77:158,78:159,94:[1,11]},{22:[1,50],32:[2,65],38:[1,58],39:[2,65],50:[2,65],52:[1,51],54:165,55:46,57:[2,65],58:47,59:48,60:49,61:[1,52],62:53,63:54,64:55,65:[1,56],66:[1,57],94:[2,65]},{11:[1,92],22:[1,93],23:[1,94],32:[1,166],34:129,35:130,36:[1,131],37:[1,132],38:[1,133],39:[1,134],40:135,41:89,42:90,48:98,49:[1,109],50:[1,110],61:[1,99],76:[1,108],80:91,82:97,83:[1,100],84:[1,101],85:[1,102],86:[1,103],87:[1,104],88:[1,105],89:[1,106],90:[1,107],91:[1,95],92:96,94:[1,11]},{32:[2,46],38:[1,168],45:167,94:[2,46]},{32:[2,43],38:[2,43],94:[2,43]},{10:169,12:[2,123],22:[2,123],33:[2,123],40:10,52:[2,123],94:[1,11]},{32:[1,170]},{22:[2,56],32:[2,56],38:[2,56],39:[2,56],50:[2,56],52:[2,56],57:[2,56],61:[2,56],65:[2,56],66:[2,56],94:[2,56]},{22:[2,57],32:[2,57],38:[2,57],39:[2,57],50:[2,57],52:[2,57],57:[2,57],61:[2,57],65:[2,57],66:[2,57],94:[2,57]},{22:[2,58],32:[2,58],38:[2,58],39:[2,58],50:[2,58],52:[2,58],57:[2,58],61:[2,58],65:[2,58],66:[2,58],94:[2,58]},{10:171,40:10,67:[2,123],70:[2,123],71:[2,123],72:[2,123],73:[2,123],74:[2,123],75:[2,123],94:[1,11]},{22:[1,172],63:173,66:[1,57]},{22:[2,86],32:[2,86],38:[2,86],39:[2,86],50:[2,86],52:[2,86],57:[2,86],61:[2,86],65:[2,86],66:[2,86],94:[2,86]},{12:[1,174]},{11:[2,16],23:[2,16]},{1:[2,123],10:175,15:[2,123],20:[2,123],22:[2,123],25:[2,123],31:[2,123],32:[2,123],38:[2,123],39:[2,123],40:10,43:[2,123],47:[2,123],50:[2,123],52:[2,123],57:[2,123],61:[2,123],65:[2,123],66:[2,123],94:[1,11],96:[2,123],97:[2,123],103:[2,123]},{11:[2,31],12:[2,31],22:[2,31],23:[2,31],32:[2,31],36:[2,31],37:[2,31],38:[2,31],39:[2,31],49:[2,31],50:[2,31],61:[2,31],76:[2,31],83:[2,31],84:[2,31],85:[2,31],86:[2,31],87:[2,31],88:[2,31],89:[2,31],90:[2,31],91:[2,31],94:[2,31]},{11:[1,92],12:[2,41],22:[1,93],23:[1,94],32:[2,41],34:176,36:[2,41],37:[2,41],38:[2,41],39:[2,41],41:89,42:90,48:98,49:[1,109],50:[1,110],61:[1,99],76:[1,108],80:91,82:97,83:[1,100],84:[1,101],85:[1,102],86:[1,103],87:[1,104],88:[1,105],89:[1,106],90:[1,107],91:[1,95],92:96,94:[2,41]},{10:177,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],61:[2,123],76:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],94:[1,11]},{10:178,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],61:[2,123],76:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],94:[1,11]},{10:179,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],61:[2,123],76:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],94:[1,11]},{10:180,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],61:[2,123],76:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],94:[1,11]},{11:[2,38],12:[2,38],22:[2,38],23:[2,38],32:[2,38],36:[2,38],37:[2,38],38:[2,38],39:[2,38],49:[2,38],50:[2,38],61:[2,38],76:[2,38],83:[2,38],84:[2,38],85:[2,38],86:[2,38],87:[2,38],88:[2,38],89:[2,38],90:[2,38],91:[2,38],94:[1,19]},{11:[1,92],22:[1,93],23:[1,94],42:141,48:98,49:[1,109],50:[1,110],61:[1,99],76:[1,108],80:181,82:97,83:[1,100],84:[1,101],85:[1,102],86:[1,103],87:[1,104],88:[1,105],89:[1,106],90:[1,107],91:[1,95],92:96},{11:[2,97],12:[2,97],22:[2,97],23:[2,97],32:[2,97],33:[2,97],36:[2,97],37:[2,97],38:[2,97],39:[2,97],49:[2,97],50:[2,97],52:[2,97],61:[2,97],70:[2,97],76:[2,97],79:[2,97],83:[2,97],84:[2,97],85:[2,97],86:[2,97],87:[2,97],88:[2,97],89:[2,97],90:[2,97],91:[2,97],93:[2,97],94:[2,97]},{10:182,11:[2,123],22:[2,123],23:[2,123],40:10,49:[2,123],50:[2,123],61:[2,123],76:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],94:[1,11]},{10:183,11:[2,123],22:[2,123],23:[2,123],40:10,49:[2,123],50:[2,123],61:[2,123],76:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],94:[1,11]},{10:184,11:[2,123],22:[2,123],23:[2,123],40:10,49:[2,123],50:[2,123],61:[2,123],76:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],94:[1,11]},{11:[2,100],12:[2,100],22:[2,100],23:[2,100],32:[2,100],33:[2,100],36:[2,100],37:[2,100],38:[2,100],39:[2,100],49:[2,100],50:[2,100],52:[2,100],61:[2,100],70:[2,100],76:[2,100],79:[2,100],83:[2,100],84:[2,100],85:[2,100],86:[2,100],87:[2,100],88:[2,100],89:[2,100],90:[2,100],91:[2,100],93:[2,100],94:[2,100]},{11:[2,110],12:[2,110],22:[2,110],23:[2,110],32:[2,110],33:[2,110],36:[2,110],37:[2,110],38:[2,110],39:[2,110],49:[2,110],50:[2,110],52:[2,110],61:[2,110],70:[2,110],76:[2,110],79:[2,110],83:[2,110],84:[2,110],85:[2,110],86:[2,110],87:[2,110],88:[2,110],89:[2,110],90:[2,110],91:[2,110],93:[2,110],94:[2,110]},{11:[2,111],12:[2,111],22:[2,111],23:[2,111],32:[2,111],33:[2,111],36:[2,111],37:[2,111],38:[2,111],39:[2,111],49:[2,111],50:[2,111],52:[2,111],61:[2,111],70:[2,111],76:[2,111],79:[2,111],83:[2,111],84:[2,111],85:[2,111],86:[2,111],87:[2,111],88:[2,111],89:[2,111],90:[2,111],91:[2,111],93:[2,111],94:[2,111]},{11:[2,112],12:[2,112],22:[2,112],23:[2,112],32:[2,112],33:[2,112],36:[2,112],37:[2,112],38:[2,112],39:[2,112],49:[2,112],50:[2,112],52:[2,112],61:[2,112],70:[2,112],76:[2,112],79:[2,112],83:[2,112],84:[2,112],85:[2,112],86:[2,112],87:[2,112],88:[2,112],89:[2,112],90:[2,112],91:[2,112],93:[2,112],94:[2,112]},{11:[2,113],12:[2,113],22:[2,113],23:[2,113],32:[2,113],33:[2,113],36:[2,113],37:[2,113],38:[2,113],39:[2,113],49:[2,113],50:[2,113],52:[2,113],61:[2,113],70:[2,113],76:[2,113],79:[2,113],83:[2,113],84:[2,113],85:[2,113],86:[2,113],87:[2,113],88:[2,113],89:[2,113],90:[2,113],91:[2,113],93:[2,113],94:[2,113]},{11:[2,99],12:[2,99],22:[2,99],23:[2,99],32:[2,99],33:[2,99],36:[2,99],37:[2,99],38:[2,99],39:[2,99],49:[2,99],50:[2,99],52:[2,99],61:[2,99],70:[2,99],76:[2,99],79:[2,99],83:[2,99],84:[2,99],85:[2,99],86:[2,99],87:[2,99],88:[2,99],89:[2,99],90:[2,99],91:[2,99],93:[2,99],94:[2,99]},{11:[2,119],12:[2,119],22:[2,119],23:[2,119],32:[2,119],33:[2,119],36:[2,119],37:[2,119],38:[2,119],39:[2,119],49:[2,119],50:[2,119],52:[2,119],61:[2,119],70:[2,119],76:[2,119],79:[2,119],83:[2,119],84:[2,119],85:[2,119],86:[2,119],87:[2,119],88:[2,119],89:[2,119],90:[2,119],91:[2,119],93:[2,119],94:[2,119]},{11:[2,101],12:[2,101],22:[2,101],23:[2,101],32:[2,101],33:[2,101],36:[2,101],37:[2,101],38:[2,101],39:[2,101],49:[2,101],50:[2,101],52:[2,101],61:[2,101],70:[2,101],76:[2,101],79:[2,101],83:[2,101],84:[2,101],85:[2,101],86:[2,101],87:[2,101],88:[2,101],89:[2,101],90:[2,101],91:[2,101],93:[2,101],94:[2,101]},{11:[2,102],12:[2,102],22:[2,102],23:[2,102],32:[2,102],33:[2,102],36:[2,102],37:[2,102],38:[2,102],39:[2,102],49:[2,102],50:[2,102],52:[2,102],61:[2,102],70:[2,102],76:[2,102],79:[2,102],83:[2,102],84:[2,102],85:[2,102],86:[2,102],87:[2,102],88:[2,102],89:[2,102],90:[2,102],91:[2,102],93:[2,102],94:[2,102]},{11:[2,103],12:[2,103],22:[2,103],23:[2,103],32:[2,103],33:[2,103],36:[2,103],37:[2,103],38:[2,103],39:[2,103],49:[2,103],50:[2,103],52:[2,103],61:[2,103],70:[2,103],76:[2,103],79:[2,103],83:[2,103],84:[2,103],85:[2,103],86:[2,103],87:[2,103],88:[2,103],89:[2,103],90:[2,103],91:[2,103],93:[2,103],94:[2,103]},{11:[2,104],12:[2,104],22:[2,104],23:[2,104],32:[2,104],33:[2,104],36:[2,104],37:[2,104],38:[2,104],39:[2,104],49:[2,104],50:[2,104],52:[2,104],61:[2,104],70:[2,104],76:[2,104],79:[2,104],83:[2,104],84:[2,104],85:[2,104],86:[2,104],87:[2,104],88:[2,104],89:[2,104],90:[2,104],91:[2,104],93:[2,104],94:[2,104]},{11:[2,105],12:[2,105],22:[2,105],23:[2,105],32:[2,105],33:[2,105],36:[2,105],37:[2,105],38:[2,105],39:[2,105],49:[2,105],50:[2,105],52:[2,105],61:[2,105],70:[2,105],76:[2,105],79:[2,105],83:[2,105],84:[2,105],85:[2,105],86:[2,105],87:[2,105],88:[2,105],89:[2,105],90:[2,105],91:[2,105],93:[2,105],94:[2,105]},{11:[2,106],12:[2,106],22:[2,106],23:[2,106],32:[2,106],33:[2,106],36:[2,106],37:[2,106],38:[2,106],39:[2,106],49:[2,106],50:[2,106],52:[2,106],61:[2,106],70:[2,106],76:[2,106],79:[2,106],83:[2,106],84:[2,106],85:[2,106],86:[2,106],87:[2,106],88:[2,106],89:[2,106],90:[2,106],91:[2,106],93:[2,106],94:[2,106]},{11:[2,107],12:[2,107],22:[2,107],23:[2,107],32:[2,107],33:[2,107],36:[2,107],37:[2,107],38:[2,107],39:[2,107],49:[2,107],50:[2,107],52:[2,107],61:[2,107],70:[2,107],76:[2,107],79:[2,107],83:[2,107],84:[2,107],85:[2,107],86:[2,107],87:[2,107],88:[2,107],89:[2,107],90:[2,107],91:[2,107],93:[2,107],94:[2,107]},{11:[2,108],12:[2,108],22:[2,108],23:[2,108],32:[2,108],33:[2,108],36:[2,108],37:[2,108],38:[2,108],39:[2,108],49:[2,108],50:[2,108],52:[2,108],61:[2,108],70:[2,108],76:[2,108],79:[2,108],83:[2,108],84:[2,108],85:[2,108],86:[2,108],87:[2,108],88:[2,108],89:[2,108],90:[2,108],91:[2,108],93:[2,108],94:[2,108]},{11:[1,92],22:[1,93],23:[1,94],41:185,42:141,48:98,49:[1,109],50:[1,110],61:[1,99],76:[1,108],80:91,82:97,83:[1,100],84:[1,101],85:[1,102],86:[1,103],87:[1,104],88:[1,105],89:[1,106],90:[1,107],91:[1,95],92:96},{10:161,12:[1,160],22:[1,163],33:[1,186],40:10,51:162,52:[1,164],77:187,78:159,94:[1,11]},{12:[2,87],22:[2,87],33:[2,87],52:[2,87],94:[2,87]},{12:[2,89],22:[2,89],33:[2,89],52:[2,89],94:[2,89]},{12:[2,90],22:[2,90],33:[2,90],52:[2,90],94:[2,90]},{12:[2,91],22:[2,91],33:[2,91],52:[2,91],94:[2,91]},{38:[1,188]},{10:189,38:[2,123],40:10,94:[1,11]},{22:[1,190]},{22:[2,60],32:[2,54],38:[2,60],39:[2,54],40:75,50:[1,73],52:[2,60],56:72,57:[1,74],61:[2,60],65:[2,60],66:[2,60],94:[1,11]},{10:191,22:[2,123],25:[2,123],31:[2,123],32:[2,123],33:[2,123],38:[2,123],39:[2,123],40:10,43:[2,123],47:[2,123],50:[2,123],52:[2,123],57:[2,123],61:[2,123],65:[2,123],66:[2,123],94:[1,11],96:[2,123],97:[2,123],103:[2,123]},{10:192,32:[2,123],40:10,94:[1,11]},{22:[1,193]},{10:161,12:[1,160],22:[1,163],33:[2,94],40:10,46:194,51:162,52:[1,164],77:158,78:159,94:[1,11]},{10:195,11:[2,123],22:[2,123],33:[2,123],40:10,84:[2,123],94:[1,11]},{67:[1,196],68:197,70:[1,198],71:[1,199],72:[1,200],73:[1,201],74:[1,202],75:[1,203]},{10:204,37:[2,123],40:10,94:[1,11]},{10:205,37:[2,123],40:10,94:[1,11]},{1:[2,123],10:206,20:[2,123],22:[2,123],25:[2,123],31:[2,123],32:[2,123],38:[2,123],39:[2,123],40:10,43:[2,123],47:[2,123],50:[2,123],52:[2,123],57:[2,123],61:[2,123],65:[2,123],66:[2,123],94:[1,11],96:[2,123],97:[2,123],103:[2,123]},{1:[2,9],15:[2,9],20:[2,9],22:[2,9],25:[2,9],31:[2,9],32:[2,9],38:[2,9],39:[2,9],43:[2,9],47:[2,9],50:[2,9],52:[2,9],57:[2,9],61:[2,9],65:[2,9],66:[2,9],94:[2,9],96:[2,9],97:[2,9],103:[2,9]},{11:[2,32],12:[2,32],22:[2,32],23:[2,32],32:[2,32],36:[2,32],37:[2,32],38:[2,32],39:[2,32],49:[2,32],50:[2,32],61:[2,32],76:[2,32],83:[2,32],84:[2,32],85:[2,32],86:[2,32],87:[2,32],88:[2,32],89:[2,32],90:[2,32],91:[2,32],94:[2,32]},{11:[2,34],12:[2,34],22:[2,34],23:[2,34],32:[2,34],36:[2,34],37:[2,34],38:[2,34],39:[2,34],49:[2,34],50:[2,34],61:[2,34],76:[2,34],83:[2,34],84:[2,34],85:[2,34],86:[2,34],87:[2,34],88:[2,34],89:[2,34],90:[2,34],91:[2,34],94:[2,34]},{11:[2,35],12:[2,35],22:[2,35],23:[2,35],32:[2,35],36:[2,35],37:[2,35],38:[2,35],39:[2,35],49:[2,35],50:[2,35],61:[2,35],76:[2,35],83:[2,35],84:[2,35],85:[2,35],86:[2,35],87:[2,35],88:[2,35],89:[2,35],90:[2,35],91:[2,35],94:[2,35]},{11:[2,36],12:[2,36],22:[2,36],23:[2,36],32:[2,36],36:[2,36],37:[2,36],38:[2,36],39:[2,36],49:[2,36],50:[2,36],61:[2,36],76:[2,36],83:[2,36],84:[2,36],85:[2,36],86:[2,36],87:[2,36],88:[2,36],89:[2,36],90:[2,36],91:[2,36],94:[2,36]},{11:[2,37],12:[2,37],22:[2,37],23:[2,37],32:[2,37],36:[2,37],37:[2,37],38:[2,37],39:[2,37],49:[2,37],50:[2,37],61:[2,37],76:[2,37],83:[2,37],84:[2,37],85:[2,37],86:[2,37],87:[2,37],88:[2,37],89:[2,37],90:[2,37],91:[2,37],94:[2,37]},{11:[2,96],12:[2,96],22:[2,96],23:[2,96],32:[2,96],33:[2,96],36:[2,96],37:[2,96],38:[2,96],39:[2,96],49:[2,96],50:[2,96],52:[2,96],61:[2,96],70:[2,96],76:[2,96],79:[2,96],83:[2,96],84:[2,96],85:[2,96],86:[2,96],87:[2,96],88:[2,96],89:[2,96],90:[2,96],91:[2,96],93:[2,96],94:[2,96]},{11:[2,115],22:[2,115],23:[2,115],49:[2,115],50:[2,115],61:[2,115],76:[2,115],83:[2,115],84:[2,115],85:[2,115],86:[2,115],87:[2,115],88:[2,115],89:[2,115],90:[2,115],91:[2,115]},{11:[2,116],22:[2,116],23:[2,116],49:[2,116],50:[2,116],61:[2,116],76:[2,116],83:[2,116],84:[2,116],85:[2,116],86:[2,116],87:[2,116],88:[2,116],89:[2,116],90:[2,116],91:[2,116]},{11:[2,117],22:[2,117],23:[2,117],49:[2,117],50:[2,117],61:[2,117],76:[2,117],83:[2,117],84:[2,117],85:[2,117],86:[2,117],87:[2,117],88:[2,117],89:[2,117],90:[2,117],91:[2,117]},{11:[1,92],22:[1,93],23:[1,94],37:[1,207],39:[1,139],42:141,48:98,49:[1,109],50:[1,110],61:[1,99],70:[1,140],76:[1,108],80:137,81:136,82:97,83:[1,100],84:[1,101],85:[1,102],86:[1,103],87:[1,104],88:[1,105],89:[1,106],90:[1,107],91:[1,95],92:96,93:[1,138]},{1:[2,123],10:208,22:[2,123],31:[2,123],32:[2,123],33:[2,123],38:[2,123],39:[2,123],40:10,43:[2,123],47:[2,123],50:[2,123],52:[2,123],57:[2,123],61:[2,123],65:[2,123],66:[2,123],94:[1,11],96:[2,123],97:[2,123],103:[2,123]},{12:[2,88],22:[2,88],33:[2,88],52:[2,88],94:[2,88]},{10:209,11:[2,123],22:[2,123],23:[2,123],40:10,49:[2,123],50:[2,123],61:[2,123],76:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],94:[1,11]},{38:[2,50]},{10:210,38:[2,123],40:10,94:[1,11]},{5:65,8:211,22:[1,50],24:31,25:[1,32],26:34,27:35,28:36,29:37,30:38,31:[1,40],32:[2,126],33:[2,126],38:[1,58],39:[2,126],43:[1,41],47:[1,42],50:[2,126],52:[1,51],53:39,54:44,55:46,57:[2,126],58:47,59:48,60:49,61:[1,52],62:53,63:54,64:55,65:[1,56],66:[1,57],94:[1,6],95:5,96:[1,7],97:[1,8],98:43,103:[1,45]},{32:[1,212]},{32:[2,45],94:[2,45]},{10:161,12:[1,160],22:[1,163],33:[1,213],40:10,51:162,52:[1,164],77:187,78:159,94:[1,11]},{11:[1,219],22:[1,218],33:[2,133],84:[1,220],99:214,100:215,101:216,102:217},{22:[2,73],32:[2,73],37:[2,73],38:[2,73],39:[2,73],50:[2,73],52:[2,73],57:[2,73],61:[2,73],65:[2,73],66:[2,73],94:[2,73]},{10:221,11:[2,123],22:[2,123],40:10,94:[1,11]},{11:[2,75],22:[2,75],94:[2,75]},{11:[2,76],22:[2,76],94:[2,76]},{11:[2,77],22:[2,77],94:[2,77]},{11:[2,78],22:[2,78],94:[2,78]},{11:[2,79],22:[2,79],94:[2,79]},{11:[2,80],22:[2,80],94:[2,80]},{37:[1,222]},{37:[1,223]},{1:[2,15],20:[2,15],22:[2,15],25:[2,15],31:[2,15],32:[2,15],38:[2,15],39:[2,15],43:[2,15],47:[2,15],50:[2,15],52:[2,15],57:[2,15],61:[2,15],65:[2,15],66:[2,15],94:[2,15],96:[2,15],97:[2,15],103:[2,15]},{10:224,11:[2,123],12:[2,123],22:[2,123],23:[2,123],32:[2,123],33:[2,123],36:[2,123],37:[2,123],38:[2,123],39:[2,123],40:10,49:[2,123],50:[2,123],52:[2,123],61:[2,123],70:[2,123],76:[2,123],79:[2,123],83:[2,123],84:[2,123],85:[2,123],86:[2,123],87:[2,123],88:[2,123],89:[2,123],90:[2,123],91:[2,123],93:[2,123],94:[1,11]},{1:[2,52],22:[2,52],31:[2,52],32:[2,52],33:[2,52],38:[2,52],39:[2,52],43:[2,52],47:[2,52],50:[2,52],52:[2,52],57:[2,52],61:[2,52],65:[2,52],66:[2,52],94:[2,52],96:[2,52],97:[2,52],103:[2,52]},{11:[1,92],22:[1,93],23:[1,94],41:225,42:141,48:98,49:[1,109],50:[1,110],61:[1,99],76:[1,108],80:91,82:97,83:[1,100],84:[1,101],85:[1,102],86:[1,103],87:[1,104],88:[1,105],89:[1,106],90:[1,107],91:[1,95],92:96},{38:[2,51]},{5:65,22:[1,50],24:64,26:34,27:35,28:36,29:37,30:38,31:[1,40],32:[2,126],33:[1,226],38:[1,58],39:[2,126],43:[1,41],47:[1,42],50:[2,126],52:[1,51],53:39,54:44,55:46,57:[2,126],58:47,59:48,60:49,61:[1,52],62:53,63:54,64:55,65:[1,56],66:[1,57],94:[1,6],95:5,96:[1,7],97:[1,8],98:43,103:[1,45]},{10:227,12:[2,123],22:[2,123],33:[2,123],40:10,52:[2,123],94:[1,11]},{1:[2,123],10:228,22:[2,123],31:[2,123],32:[2,123],33:[2,123],38:[2,123],39:[2,123],40:10,43:[2,123],47:[2,123],50:[2,123],52:[2,123],57:[2,123],61:[2,123],65:[2,123],66:[2,123],94:[1,11],96:[2,123],97:[2,123],103:[2,123]},{11:[1,219],22:[1,218],33:[1,229],84:[1,220],100:230,101:216,102:217},{11:[2,131],22:[2,131],33:[2,131],84:[2,131]},{32:[1,231],39:[1,232]},{10:233,32:[2,123],39:[2,123],40:10,94:[1,11]},{32:[2,137],39:[2,137],94:[2,137]},{32:[2,138],39:[2,138],94:[2,138]},{32:[2,139],39:[2,139],94:[2,139]},{11:[1,236],22:[1,235],69:234},{22:[2,84],32:[2,84],38:[2,84],39:[2,84],50:[2,84],52:[2,84],57:[2,84],61:[2,84],65:[2,84],66:[2,84],94:[2,84]},{22:[2,85],32:[2,85],38:[2,85],39:[2,85],50:[2,85],52:[2,85],57:[2,85],61:[2,85],65:[2,85],66:[2,85],94:[2,85]},{11:[2,109],12:[2,109],22:[2,109],23:[2,109],32:[2,109],33:[2,109],36:[2,109],37:[2,109],38:[2,109],39:[2,109],49:[2,109],50:[2,109],52:[2,109],61:[2,109],70:[2,109],76:[2,109],79:[2,109],83:[2,109],84:[2,109],85:[2,109],86:[2,109],87:[2,109],88:[2,109],89:[2,109],90:[2,109],91:[2,109],93:[2,109],94:[2,109]},{10:237,11:[1,92],12:[2,123],22:[1,93],23:[1,94],33:[2,123],39:[1,139],40:10,42:141,48:98,49:[1,109],50:[1,110],52:[2,123],61:[1,99],70:[1,140],76:[1,108],79:[1,238],80:137,81:136,82:97,83:[1,100],84:[1,101],85:[1,102],86:[1,103],87:[1,104],88:[1,105],89:[1,106],90:[1,107],91:[1,95],92:96,93:[1,138],94:[1,11]},{1:[2,123],10:239,22:[2,123],31:[2,123],32:[2,123],33:[2,123],38:[2,123],39:[2,123],40:10,43:[2,123],47:[2,123],50:[2,123],52:[2,123],57:[2,123],61:[2,123],65:[2,123],66:[2,123],94:[1,11],96:[2,123],97:[2,123],103:[2,123]},{10:161,12:[1,160],22:[1,163],33:[2,94],40:10,46:240,51:162,52:[1,164],77:158,78:159,94:[1,11]},{1:[2,47],22:[2,47],31:[2,47],32:[2,47],33:[2,47],38:[2,47],39:[2,47],43:[2,47],47:[2,47],50:[2,47],52:[2,47],57:[2,47],61:[2,47],65:[2,47],66:[2,47],94:[2,47],96:[2,47],97:[2,47],103:[2,47]},{1:[2,123],10:241,22:[2,123],31:[2,123],32:[2,123],33:[2,123],38:[2,123],39:[2,123],40:10,43:[2,123],47:[2,123],50:[2,123],52:[2,123],57:[2,123],61:[2,123],65:[2,123],66:[2,123],94:[1,11],96:[2,123],97:[2,123],103:[2,123]},{11:[2,132],22:[2,132],33:[2,132],84:[2,132]},{10:242,12:[2,123],22:[2,123],33:[2,123],40:10,52:[2,123],94:[1,11]},{11:[1,219],22:[1,218],84:[1,220],102:243},{32:[2,135],39:[2,135]},{10:244,40:10,67:[2,123],94:[1,11]},{67:[2,81],94:[2,81]},{67:[2,82],94:[2,82]},{12:[2,92],22:[2,92],33:[2,92],52:[2,92],94:[2,92]},{10:245,12:[2,123],22:[2,123],33:[2,123],40:10,52:[2,123],94:[1,11]},{1:[2,29],22:[2,29],31:[2,29],32:[2,29],33:[2,29],38:[2,29],39:[2,29],43:[2,29],47:[2,29],50:[2,29],52:[2,29],57:[2,29],61:[2,29],65:[2,29],66:[2,29],94:[2,29],96:[2,29],97:[2,29],103:[2,29]},{10:161,12:[1,160],22:[1,163],33:[1,246],40:10,51:162,52:[1,164],77:187,78:159,94:[1,11]},{1:[2,130],22:[2,130],31:[2,130],32:[2,130],33:[2,130],38:[2,130],39:[2,130],43:[2,130],47:[2,130],50:[2,130],52:[2,130],57:[2,130],61:[2,130],65:[2,130],66:[2,130],94:[2,130],96:[2,130],97:[2,130],103:[2,130]},{10:161,12:[1,160],22:[1,163],33:[2,94],40:10,46:247,51:162,52:[1,164],77:158,78:159,94:[1,11]},{10:248,32:[2,123],39:[2,123],40:10,94:[1,11]},{67:[1,249]},{12:[2,93],22:[2,93],33:[2,93],52:[2,93],94:[2,93]},{1:[2,123],10:250,22:[2,123],31:[2,123],32:[2,123],33:[2,123],38:[2,123],39:[2,123],40:10,43:[2,123],47:[2,123],50:[2,123],52:[2,123],57:[2,123],61:[2,123],65:[2,123],66:[2,123],94:[1,11],96:[2,123],97:[2,123],103:[2,123]},{10:161,12:[1,160],22:[1,163],33:[1,251],40:10,51:162,52:[1,164],77:187,78:159,94:[1,11]},{32:[2,136],39:[2,136]},{22:[2,74],32:[2,74],37:[2,74],38:[2,74],39:[2,74],50:[2,74],52:[2,74],57:[2,74],61:[2,74],65:[2,74],66:[2,74],94:[2,74]},{1:[2,42],22:[2,42],31:[2,42],32:[2,42],33:[2,42],38:[2,42],39:[2,42],43:[2,42],47:[2,42],50:[2,42],52:[2,42],57:[2,42],61:[2,42],65:[2,42],66:[2,42],94:[2,42],96:[2,42],97:[2,42],103:[2,42]},{10:252,11:[2,123],22:[2,123],33:[2,123],40:10,84:[2,123],94:[1,11]},{11:[2,134],22:[2,134],33:[2,134],84:[2,134]}],
defaultActions: {76:[2,140],189:[2,50],210:[2,51]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                this.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.2.1 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input) {
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 94;
break;
case 1:
break;
case 2:return 96;
break;
case 3:return 97;
break;
case 4:return 71;
break;
case 5:return 72;
break;
case 6:return 73;
break;
case 7:return 74;
break;
case 8:return 75;
break;
case 9:return 79;
break;
case 10:return 23;
break;
case 11:return 23;
break;
case 12:return "FUNCTION";
break;
case 13:return 103;
break;
case 14:return 11;
break;
case 15:return 22;
break;
case 16:return 61;
break;
case 17:return 15;
break;
case 18:return 43;
break;
case 19:return 31;
break;
case 20:return 47;
break;
case 21:return 9;
break;
case 22:return 20;
break;
case 23:return 86;
break;
case 24:return 87;
break;
case 25:return 85;
break;
case 26:return 85;
break;
case 27:return 85;
break;
case 28:return 85;
break;
case 29:return 85;
break;
case 30:return 85;
break;
case 31:return 85;
break;
case 32:return 88;
break;
case 33:return 88;
break;
case 34:return 88;
break;
case 35:return 89;
break;
case 36:return 89;
break;
case 37:return 90;
break;
case 38:return 90;
break;
case 39:return 'DIMEN';
break;
case 40:return 84;
break;
case 41:return 83;
break;
case 42:return 91;
break;
case 43:return 91;
break;
case 44:return yy_.yytext;
break;
}
},
rules: [/^(?:[ \t\r\n\f]+)/,/^(?:\/\*[^*]*\*+([^/][^*]*\*+)*\/)/,/^(?:<!--)/,/^(?:-->)/,/^(?:~=)/,/^(?:\|=)/,/^(?:\^=)/,/^(?:\$=)/,/^(?:\*=)/,/^(?:!([ \t\r\n\f]*)important\b)/,/^(?:url\(([ \t\r\n\f]*)(("([\t !#$%&(-~]|\\(\n|\r\n|\r|\f)|'|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))*")|('([\t !#$%&(-~]|\\(\n|\r\n|\r|\f)|"|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))*'))([ \t\r\n\f]*)\))/,/^(?:url\(([ \t\r\n\f]*)(([!#$%&*-~]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))*)([ \t\r\n\f]*)\))/,/^(?:([-]?([a-zA-Z]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))([_]|([a-zA-Z0-9-]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377])))*)\()/,/^(?:([@](-webkit-|-o-|-moz-|-ms-)?keyframes\b))/,/^(?:(("([\t !#$%&(-~]|\\(\n|\r\n|\r|\f)|'|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))*")|('([\t !#$%&(-~]|\\(\n|\r\n|\r|\f)|"|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))*')))/,/^(?:([-]?([a-zA-Z]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))([_]|([a-zA-Z0-9-]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377])))*))/,/^(?:#(([_]|([a-zA-Z0-9-]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377])))+))/,/^(?:@import\b)/,/^(?:@page\b)/,/^(?:@media\b)/,/^(?:@font-face\b)/,/^(?:@charset\b)/,/^(?:@namespace\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))em\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))ex\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))px\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))cm\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))mm\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))in\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))pt\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))pc\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))fr\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))deg\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))rad\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))grad\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))ms\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))s\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))Hz\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))kHz\b)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))([-]?([a-zA-Z]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377]))([_]|([a-zA-Z0-9-]|([\200-\377])|((\\([0-9a-fA-F]){1,6}[ \t\r\n\f]?)|\\[ -~\200-\377])))*))/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+))%)/,/^(?:(([0-9]+(\.[0-9]+)?)|(\.[0-9]+)))/,/^(?:U\+(\?{1,6}|([0-9a-fA-F])(\?{0,5}|([0-9a-fA-F])(\?{0,4}|([0-9a-fA-F])(\?{0,3}|([0-9a-fA-F])(\?{0,2}|([0-9a-fA-F])(\??|([0-9a-fA-F]))))))))/,/^(?:U\+([0-9a-fA-F]){1,6}([0-9a-fA-F]){1,6})/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
return parser;
});
/*--------------------------------------------------------------------------
 * linq.js - LINQ for JavaScript
 * ver 3.0.2-RC (Sep. 16th, 2012)
 *
 * created and maintained by neuecc <ils@neue.cc>
 * licensed under MIT License
 * http://linqjs.codeplex.com/
 *------------------------------------------------------------------------*/
(function(w,j){var l="enumerator is disposed",q="single:sequence contains more than one element.",a=false,b=null,e=true,g={Identity:function(a){return a},True:function(){return e},Blank:function(){}},i={Boolean:typeof e,Number:typeof 0,String:typeof"",Object:typeof{},Undefined:typeof j,Function:typeof function(){}},d={createLambda:function(a){if(a==b)return g.Identity;if(typeof a==i.String)if(a=="")return g.Identity;else if(a.indexOf("=>")==-1){var m=new RegExp("[$]+","g"),c=0,j;while(j=m.exec(a)){var e=j[0].length;if(e>c)c=e}for(var f=[],d=1;d<=c;d++){for(var h="",l=0;l<d;l++)h+="$";f.push(h)}var n=Array.prototype.join.call(f,",");return new Function(n,"return "+a)}else{var k=a.match(/^[(\s]*([^()]*?)[)\s]*=>(.*)/);return new Function(k[1],"return "+k[2])}return a},isIEnumerable:function(b){if(typeof Enumerator!==i.Undefined)try{new Enumerator(b);return e}catch(c){}return a},defineProperty:Object.defineProperties!=b?function(c,b,d){Object.defineProperty(c,b,{enumerable:a,configurable:e,writable:e,value:d})}:function(b,a,c){b[a]=c},compare:function(a,b){return a===b?0:a>b?1:-1},dispose:function(a){a!=b&&a.dispose()}},o={Before:0,Running:1,After:2},f=function(d,f,g){var c=new u,b=o.Before;this.current=c.current;this.moveNext=function(){try{switch(b){case o.Before:b=o.Running;d();case o.Running:if(f.apply(c))return e;else{this.dispose();return a}case o.After:return a}}catch(g){this.dispose();throw g;}};this.dispose=function(){if(b!=o.Running)return;try{g()}finally{b=o.After}}},u=function(){var c=b;this.current=function(){return c};this.yieldReturn=function(a){c=a;return e};this.yieldBreak=function(){return a}},c=function(a){this.getEnumerator=a};c.Utils={};c.Utils.createLambda=function(a){return d.createLambda(a)};c.Utils.createEnumerable=function(a){return new c(a)};c.Utils.createEnumerator=function(a,b,c){return new f(a,b,c)};c.Utils.extendTo=function(i){var e=i.prototype,f;if(i===Array){f=h.prototype;d.defineProperty(e,"getSource",function(){return this})}else{f=c.prototype;d.defineProperty(e,"getEnumerator",function(){return c.from(this).getEnumerator()})}for(var a in f){var g=f[a];if(e[a]==g)continue;if(e[a]!=b){a=a+"ByLinq";if(e[a]==g)continue}g instanceof Function&&d.defineProperty(e,a,g)}};c.choice=function(){var a=arguments;return new c(function(){return new f(function(){a=a[0]instanceof Array?a[0]:a[0].getEnumerator!=b?a[0].toArray():a},function(){return this.yieldReturn(a[Math.floor(Math.random()*a.length)])},g.Blank)})};c.cycle=function(){var a=arguments;return new c(function(){var c=0;return new f(function(){a=a[0]instanceof Array?a[0]:a[0].getEnumerator!=b?a[0].toArray():a},function(){if(c>=a.length)c=0;return this.yieldReturn(a[c++])},g.Blank)})};c.empty=function(){return new c(function(){return new f(g.Blank,function(){return a},g.Blank)})};c.from=function(j){if(j==b)return c.empty();if(j instanceof c)return j;if(typeof j==i.Number||typeof j==i.Boolean)return c.repeat(j,1);if(typeof j==i.String)return new c(function(){var b=0;return new f(g.Blank,function(){return b<j.length?this.yieldReturn(j.charAt(b++)):a},g.Blank)});if(typeof j!=i.Function){if(typeof j.length==i.Number)return new h(j);if(!(j instanceof Object)&&d.isIEnumerable(j))return new c(function(){var c=e,b;return new f(function(){b=new Enumerator(j)},function(){if(c)c=a;else b.moveNext();return b.atEnd()?a:this.yieldReturn(b.item())},g.Blank)});if(typeof Windows===i.Object&&typeof j.first===i.Function)return new c(function(){var c=e,b;return new f(function(){b=j.first()},function(){if(c)c=a;else b.moveNext();return b.hasCurrent?this.yieldReturn(b.current):this.yieldBreak()},g.Blank)})}return new c(function(){var b=[],c=0;return new f(function(){for(var a in j){var c=j[a];!(c instanceof Function)&&Object.prototype.hasOwnProperty.call(j,a)&&b.push({key:a,value:c})}},function(){return c<b.length?this.yieldReturn(b[c++]):a},g.Blank)})},c.make=function(a){return c.repeat(a,1)};c.matches=function(h,e,d){if(d==b)d="";if(e instanceof RegExp){d+=e.ignoreCase?"i":"";d+=e.multiline?"m":"";e=e.source}if(d.indexOf("g")===-1)d+="g";return new c(function(){var b;return new f(function(){b=new RegExp(e,d)},function(){var c=b.exec(h);return c?this.yieldReturn(c):a},g.Blank)})};c.range=function(e,d,a){if(a==b)a=1;return new c(function(){var b,c=0;return new f(function(){b=e-a},function(){return c++<d?this.yieldReturn(b+=a):this.yieldBreak()},g.Blank)})};c.rangeDown=function(e,d,a){if(a==b)a=1;return new c(function(){var b,c=0;return new f(function(){b=e+a},function(){return c++<d?this.yieldReturn(b-=a):this.yieldBreak()},g.Blank)})};c.rangeTo=function(d,e,a){if(a==b)a=1;return d<e?new c(function(){var b;return new f(function(){b=d-a},function(){var c=b+=a;return c<=e?this.yieldReturn(c):this.yieldBreak()},g.Blank)}):new c(function(){var b;return new f(function(){b=d+a},function(){var c=b-=a;return c>=e?this.yieldReturn(c):this.yieldBreak()},g.Blank)})};c.repeat=function(a,d){return d!=b?c.repeat(a).take(d):new c(function(){return new f(g.Blank,function(){return this.yieldReturn(a)},g.Blank)})};c.repeatWithFinalize=function(a,e){a=d.createLambda(a);e=d.createLambda(e);return new c(function(){var c;return new f(function(){c=a()},function(){return this.yieldReturn(c)},function(){if(c!=b){e(c);c=b}})})};c.generate=function(a,e){if(e!=b)return c.generate(a).take(e);a=d.createLambda(a);return new c(function(){return new f(g.Blank,function(){return this.yieldReturn(a())},g.Blank)})};c.toInfinity=function(d,a){if(d==b)d=0;if(a==b)a=1;return new c(function(){var b;return new f(function(){b=d-a},function(){return this.yieldReturn(b+=a)},g.Blank)})};c.toNegativeInfinity=function(d,a){if(d==b)d=0;if(a==b)a=1;return new c(function(){var b;return new f(function(){b=d+a},function(){return this.yieldReturn(b-=a)},g.Blank)})};c.unfold=function(h,b){b=d.createLambda(b);return new c(function(){var d=e,c;return new f(g.Blank,function(){if(d){d=a;c=h;return this.yieldReturn(c)}c=b(c);return this.yieldReturn(c)},g.Blank)})};c.defer=function(a){return new c(function(){var b;return new f(function(){b=c.from(a()).getEnumerator()},function(){return b.moveNext()?this.yieldReturn(b.current()):this.yieldBreak()},function(){d.dispose(b)})})};c.prototype.traverseBreadthFirst=function(g,b){var h=this;g=d.createLambda(g);b=d.createLambda(b);return new c(function(){var i,k=0,j=[];return new f(function(){i=h.getEnumerator()},function(){while(e){if(i.moveNext()){j.push(i.current());return this.yieldReturn(b(i.current(),k))}var f=c.from(j).selectMany(function(a){return g(a)});if(!f.any())return a;else{k++;j=[];d.dispose(i);i=f.getEnumerator()}}},function(){d.dispose(i)})})};c.prototype.traverseDepthFirst=function(g,b){var h=this;g=d.createLambda(g);b=d.createLambda(b);return new c(function(){var j=[],i;return new f(function(){i=h.getEnumerator()},function(){while(e){if(i.moveNext()){var f=b(i.current(),j.length);j.push(i);i=c.from(g(i.current())).getEnumerator();return this.yieldReturn(f)}if(j.length<=0)return a;d.dispose(i);i=j.pop()}},function(){try{d.dispose(i)}finally{c.from(j).forEach(function(a){a.dispose()})}})})};c.prototype.flatten=function(){var h=this;return new c(function(){var j,i=b;return new f(function(){j=h.getEnumerator()},function(){while(e){if(i!=b)if(i.moveNext())return this.yieldReturn(i.current());else i=b;if(j.moveNext())if(j.current()instanceof Array){d.dispose(i);i=c.from(j.current()).selectMany(g.Identity).flatten().getEnumerator();continue}else return this.yieldReturn(j.current());return a}},function(){try{d.dispose(j)}finally{d.dispose(i)}})})};c.prototype.pairwise=function(b){var e=this;b=d.createLambda(b);return new c(function(){var c;return new f(function(){c=e.getEnumerator();c.moveNext()},function(){var d=c.current();return c.moveNext()?this.yieldReturn(b(d,c.current())):a},function(){d.dispose(c)})})};c.prototype.scan=function(i,g){var h;if(g==b){g=d.createLambda(i);h=a}else{g=d.createLambda(g);h=e}var j=this;return new c(function(){var b,c,k=e;return new f(function(){b=j.getEnumerator()},function(){if(k){k=a;if(!h){if(b.moveNext())return this.yieldReturn(c=b.current())}else return this.yieldReturn(c=i)}return b.moveNext()?this.yieldReturn(c=g(c,b.current())):a},function(){d.dispose(b)})})};c.prototype.select=function(e){e=d.createLambda(e);if(e.length<=1)return new m(this,b,e);else{var g=this;return new c(function(){var b,c=0;return new f(function(){b=g.getEnumerator()},function(){return b.moveNext()?this.yieldReturn(e(b.current(),c++)):a},function(){d.dispose(b)})})}};c.prototype.selectMany=function(g,e){var h=this;g=d.createLambda(g);if(e==b)e=function(b,a){return a};e=d.createLambda(e);return new c(function(){var k,i=j,l=0;return new f(function(){k=h.getEnumerator()},function(){if(i===j)if(!k.moveNext())return a;do{if(i==b){var f=g(k.current(),l++);i=c.from(f).getEnumerator()}if(i.moveNext())return this.yieldReturn(e(k.current(),i.current()));d.dispose(i);i=b}while(k.moveNext());return a},function(){try{d.dispose(k)}finally{d.dispose(i)}})})};c.prototype.where=function(b){b=d.createLambda(b);if(b.length<=1)return new n(this,b);else{var e=this;return new c(function(){var c,g=0;return new f(function(){c=e.getEnumerator()},function(){while(c.moveNext())if(b(c.current(),g++))return this.yieldReturn(c.current());return a},function(){d.dispose(c)})})}};c.prototype.choose=function(a){a=d.createLambda(a);var e=this;return new c(function(){var c,g=0;return new f(function(){c=e.getEnumerator()},function(){while(c.moveNext()){var d=a(c.current(),g++);if(d!=b)return this.yieldReturn(d)}return this.yieldBreak()},function(){d.dispose(c)})})};c.prototype.ofType=function(c){var a;switch(c){case Number:a=i.Number;break;case String:a=i.String;break;case Boolean:a=i.Boolean;break;case Function:a=i.Function;break;default:a=b}return a===b?this.where(function(a){return a instanceof c}):this.where(function(b){return typeof b===a})};c.prototype.zip=function(){var i=arguments,e=d.createLambda(arguments[arguments.length-1]),g=this;if(arguments.length==2){var h=arguments[0];return new c(function(){var i,b,j=0;return new f(function(){i=g.getEnumerator();b=c.from(h).getEnumerator()},function(){return i.moveNext()&&b.moveNext()?this.yieldReturn(e(i.current(),b.current(),j++)):a},function(){try{d.dispose(i)}finally{d.dispose(b)}})})}else return new c(function(){var a,h=0;return new f(function(){var b=c.make(g).concat(c.from(i).takeExceptLast().select(c.from)).select(function(a){return a.getEnumerator()}).toArray();a=c.from(b)},function(){if(a.all(function(a){return a.moveNext()})){var c=a.select(function(a){return a.current()}).toArray();c.push(h++);return this.yieldReturn(e.apply(b,c))}else return this.yieldBreak()},function(){c.from(a).forEach(d.dispose)})})};c.prototype.merge=function(){var b=arguments,a=this;return new c(function(){var e,g=-1;return new f(function(){e=c.make(a).concat(c.from(b).select(c.from)).select(function(a){return a.getEnumerator()}).toArray()},function(){while(e.length>0){g=g>=e.length-1?0:g+1;var a=e[g];if(a.moveNext())return this.yieldReturn(a.current());else{a.dispose();e.splice(g--,1)}}return this.yieldBreak()},function(){c.from(e).forEach(d.dispose)})})};c.prototype.join=function(n,i,h,l,k){i=d.createLambda(i);h=d.createLambda(h);l=d.createLambda(l);k=d.createLambda(k);var m=this;return new c(function(){var o,r,p=b,q=0;return new f(function(){o=m.getEnumerator();r=c.from(n).toLookup(h,g.Identity,k)},function(){while(e){if(p!=b){var c=p[q++];if(c!==j)return this.yieldReturn(l(o.current(),c));c=b;q=0}if(o.moveNext()){var d=i(o.current());p=r.get(d).toArray()}else return a}},function(){d.dispose(o)})})};c.prototype.groupJoin=function(l,h,e,j,i){h=d.createLambda(h);e=d.createLambda(e);j=d.createLambda(j);i=d.createLambda(i);var k=this;return new c(function(){var m=k.getEnumerator(),n=b;return new f(function(){m=k.getEnumerator();n=c.from(l).toLookup(e,g.Identity,i)},function(){if(m.moveNext()){var b=n.get(h(m.current()));return this.yieldReturn(j(m.current(),b))}return a},function(){d.dispose(m)})})};c.prototype.all=function(b){b=d.createLambda(b);var c=e;this.forEach(function(d){if(!b(d)){c=a;return a}});return c};c.prototype.any=function(c){c=d.createLambda(c);var b=this.getEnumerator();try{if(arguments.length==0)return b.moveNext();while(b.moveNext())if(c(b.current()))return e;return a}finally{d.dispose(b)}};c.prototype.isEmpty=function(){return!this.any()};c.prototype.concat=function(){var e=this;if(arguments.length==1){var g=arguments[0];return new c(function(){var i,h;return new f(function(){i=e.getEnumerator()},function(){if(h==b){if(i.moveNext())return this.yieldReturn(i.current());h=c.from(g).getEnumerator()}return h.moveNext()?this.yieldReturn(h.current()):a},function(){try{d.dispose(i)}finally{d.dispose(h)}})})}else{var h=arguments;return new c(function(){var a;return new f(function(){a=c.make(e).concat(c.from(h).select(c.from)).select(function(a){return a.getEnumerator()}).toArray()},function(){while(a.length>0){var b=a[0];if(b.moveNext())return this.yieldReturn(b.current());else{b.dispose();a.splice(0,1)}}return this.yieldBreak()},function(){c.from(a).forEach(d.dispose)})})}};c.prototype.insert=function(h,b){var g=this;return new c(function(){var j,i,l=0,k=a;return new f(function(){j=g.getEnumerator();i=c.from(b).getEnumerator()},function(){if(l==h&&i.moveNext()){k=e;return this.yieldReturn(i.current())}if(j.moveNext()){l++;return this.yieldReturn(j.current())}return!k&&i.moveNext()?this.yieldReturn(i.current()):a},function(){try{d.dispose(j)}finally{d.dispose(i)}})})};c.prototype.alternate=function(a){var g=this;return new c(function(){var j,i,k,h;return new f(function(){if(a instanceof Array||a.getEnumerator!=b)k=c.from(c.from(a).toArray());else k=c.make(a);i=g.getEnumerator();if(i.moveNext())j=i.current()},function(){while(e){if(h!=b)if(h.moveNext())return this.yieldReturn(h.current());else h=b;if(j==b&&i.moveNext()){j=i.current();h=k.getEnumerator();continue}else if(j!=b){var a=j;j=b;return this.yieldReturn(a)}return this.yieldBreak()}},function(){try{d.dispose(i)}finally{d.dispose(h)}})})};c.prototype.contains=function(f,b){b=d.createLambda(b);var c=this.getEnumerator();try{while(c.moveNext())if(b(c.current())===f)return e;return a}finally{d.dispose(c)}};c.prototype.defaultIfEmpty=function(g){var h=this;if(g===j)g=b;return new c(function(){var b,c=e;return new f(function(){b=h.getEnumerator()},function(){if(b.moveNext()){c=a;return this.yieldReturn(b.current())}else if(c){c=a;return this.yieldReturn(g)}return a},function(){d.dispose(b)})})};c.prototype.distinct=function(a){return this.except(c.empty(),a)};c.prototype.distinctUntilChanged=function(b){b=d.createLambda(b);var e=this;return new c(function(){var c,g,h;return new f(function(){c=e.getEnumerator()},function(){while(c.moveNext()){var d=b(c.current());if(h){h=a;g=d;return this.yieldReturn(c.current())}if(g===d)continue;g=d;return this.yieldReturn(c.current())}return this.yieldBreak()},function(){d.dispose(c)})})};c.prototype.except=function(e,b){b=d.createLambda(b);var g=this;return new c(function(){var h,i;return new f(function(){h=g.getEnumerator();i=new r(b);c.from(e).forEach(function(a){i.add(a)})},function(){while(h.moveNext()){var b=h.current();if(!i.contains(b)){i.add(b);return this.yieldReturn(b)}}return a},function(){d.dispose(h)})})};c.prototype.intersect=function(e,b){b=d.createLambda(b);var g=this;return new c(function(){var h,i,j;return new f(function(){h=g.getEnumerator();i=new r(b);c.from(e).forEach(function(a){i.add(a)});j=new r(b)},function(){while(h.moveNext()){var b=h.current();if(!j.contains(b)&&i.contains(b)){j.add(b);return this.yieldReturn(b)}}return a},function(){d.dispose(h)})})};c.prototype.sequenceEqual=function(h,f){f=d.createLambda(f);var g=this.getEnumerator();try{var b=c.from(h).getEnumerator();try{while(g.moveNext())if(!b.moveNext()||f(g.current())!==f(b.current()))return a;return b.moveNext()?a:e}finally{d.dispose(b)}}finally{d.dispose(g)}};c.prototype.union=function(e,b){b=d.createLambda(b);var g=this;return new c(function(){var k,h,i;return new f(function(){k=g.getEnumerator();i=new r(b)},function(){var b;if(h===j){while(k.moveNext()){b=k.current();if(!i.contains(b)){i.add(b);return this.yieldReturn(b)}}h=c.from(e).getEnumerator()}while(h.moveNext()){b=h.current();if(!i.contains(b)){i.add(b);return this.yieldReturn(b)}}return a},function(){try{d.dispose(k)}finally{d.dispose(h)}})})};c.prototype.orderBy=function(b){return new k(this,b,a)};c.prototype.orderByDescending=function(a){return new k(this,a,e)};c.prototype.reverse=function(){var b=this;return new c(function(){var c,d;return new f(function(){c=b.toArray();d=c.length},function(){return d>0?this.yieldReturn(c[--d]):a},g.Blank)})};c.prototype.shuffle=function(){var b=this;return new c(function(){var c;return new f(function(){c=b.toArray()},function(){if(c.length>0){var b=Math.floor(Math.random()*c.length);return this.yieldReturn(c.splice(b,1)[0])}return a},g.Blank)})};c.prototype.weightedSample=function(a){a=d.createLambda(a);var e=this;return new c(function(){var c,d=0;return new f(function(){c=e.choose(function(e){var c=a(e);if(c<=0)return b;d+=c;return{value:e,bound:d}}).toArray()},function(){if(c.length>0){var f=Math.floor(Math.random()*d)+1,e=-1,a=c.length;while(a-e>1){var b=Math.floor((e+a)/2);if(c[b].bound>=f)a=b;else e=b}return this.yieldReturn(c[a].value)}return this.yieldBreak()},g.Blank)})};c.prototype.groupBy=function(i,h,e,g){var j=this;i=d.createLambda(i);h=d.createLambda(h);if(e!=b)e=d.createLambda(e);g=d.createLambda(g);return new c(function(){var c;return new f(function(){c=j.toLookup(i,h,g).toEnumerable().getEnumerator()},function(){while(c.moveNext())return e==b?this.yieldReturn(c.current()):this.yieldReturn(e(c.current().key(),c.current()));return a},function(){d.dispose(c)})})};c.prototype.partitionBy=function(j,i,g,h){var l=this;j=d.createLambda(j);i=d.createLambda(i);h=d.createLambda(h);var k;if(g==b){k=a;g=function(b,a){return new t(b,a)}}else{k=e;g=d.createLambda(g)}return new c(function(){var b,n,o,m=[];return new f(function(){b=l.getEnumerator();if(b.moveNext()){n=j(b.current());o=h(n);m.push(i(b.current()))}},function(){var d;while((d=b.moveNext())==e)if(o===h(j(b.current())))m.push(i(b.current()));else break;if(m.length>0){var f=k?g(n,c.from(m)):g(n,m);if(d){n=j(b.current());o=h(n);m=[i(b.current())]}else m=[];return this.yieldReturn(f)}return a},function(){d.dispose(b)})})};c.prototype.buffer=function(e){var b=this;return new c(function(){var c;return new f(function(){c=b.getEnumerator()},function(){var b=[],d=0;while(c.moveNext()){b.push(c.current());if(++d>=e)return this.yieldReturn(b)}return b.length>0?this.yieldReturn(b):a},function(){d.dispose(c)})})};c.prototype.aggregate=function(c,b,a){a=d.createLambda(a);return a(this.scan(c,b,a).last())};c.prototype.average=function(a){a=d.createLambda(a);var c=0,b=0;this.forEach(function(d){c+=a(d);++b});return c/b};c.prototype.count=function(a){a=a==b?g.True:d.createLambda(a);var c=0;this.forEach(function(d,b){if(a(d,b))++c});return c};c.prototype.max=function(a){if(a==b)a=g.Identity;return this.select(a).aggregate(function(a,b){return a>b?a:b})};c.prototype.min=function(a){if(a==b)a=g.Identity;return this.select(a).aggregate(function(a,b){return a<b?a:b})};c.prototype.maxBy=function(a){a=d.createLambda(a);return this.aggregate(function(b,c){return a(b)>a(c)?b:c})};c.prototype.minBy=function(a){a=d.createLambda(a);return this.aggregate(function(b,c){return a(b)<a(c)?b:c})};c.prototype.sum=function(a){if(a==b)a=g.Identity;return this.select(a).aggregate(0,function(a,b){return a+b})};c.prototype.elementAt=function(d){var c,b=a;this.forEach(function(g,f){if(f==d){c=g;b=e;return a}});if(!b)throw new Error("index is less than 0 or greater than or equal to the number of elements in source.");return c};c.prototype.elementAtOrDefault=function(g,c){if(c===j)c=b;var f,d=a;this.forEach(function(c,b){if(b==g){f=c;d=e;return a}});return!d?c:f};c.prototype.first=function(c){if(c!=b)return this.where(c).first();var f,d=a;this.forEach(function(b){f=b;d=e;return a});if(!d)throw new Error("first:No element satisfies the condition.");return f};c.prototype.firstOrDefault=function(d,c){if(c===j)c=b;if(d!=b)return this.where(d).firstOrDefault(b,c);var g,f=a;this.forEach(function(b){g=b;f=e;return a});return!f?c:g};c.prototype.last=function(c){if(c!=b)return this.where(c).last();var f,d=a;this.forEach(function(a){d=e;f=a});if(!d)throw new Error("last:No element satisfies the condition.");return f};c.prototype.lastOrDefault=function(d,c){if(c===j)c=b;if(d!=b)return this.where(d).lastOrDefault(b,c);var g,f=a;this.forEach(function(a){f=e;g=a});return!f?c:g};c.prototype.single=function(d){if(d!=b)return this.where(d).single();var f,c=a;this.forEach(function(a){if(!c){c=e;f=a}else throw new Error(q);});if(!c)throw new Error("single:No element satisfies the condition.");return f};c.prototype.singleOrDefault=function(f,c){if(c===j)c=b;if(f!=b)return this.where(f).singleOrDefault(b,c);var g,d=a;this.forEach(function(a){if(!d){d=e;g=a}else throw new Error(q);});return!d?c:g};c.prototype.skip=function(e){var b=this;return new c(function(){var c,g=0;return new f(function(){c=b.getEnumerator();while(g++<e&&c.moveNext());},function(){return c.moveNext()?this.yieldReturn(c.current()):a},function(){d.dispose(c)})})};c.prototype.skipWhile=function(b){b=d.createLambda(b);var g=this;return new c(function(){var c,i=0,h=a;return new f(function(){c=g.getEnumerator()},function(){while(!h)if(c.moveNext()){if(!b(c.current(),i++)){h=e;return this.yieldReturn(c.current())}continue}else return a;return c.moveNext()?this.yieldReturn(c.current()):a},function(){d.dispose(c)})})};c.prototype.take=function(e){var b=this;return new c(function(){var c,g=0;return new f(function(){c=b.getEnumerator()},function(){return g++<e&&c.moveNext()?this.yieldReturn(c.current()):a},function(){d.dispose(c)})})};c.prototype.takeWhile=function(b){b=d.createLambda(b);var e=this;return new c(function(){var c,g=0;return new f(function(){c=e.getEnumerator()},function(){return c.moveNext()&&b(c.current(),g++)?this.yieldReturn(c.current()):a},function(){d.dispose(c)})})};c.prototype.takeExceptLast=function(e){if(e==b)e=1;var g=this;return new c(function(){if(e<=0)return g.getEnumerator();var b,c=[];return new f(function(){b=g.getEnumerator()},function(){while(b.moveNext()){if(c.length==e){c.push(b.current());return this.yieldReturn(c.shift())}c.push(b.current())}return a},function(){d.dispose(b)})})};c.prototype.takeFromLast=function(e){if(e<=0||e==b)return c.empty();var g=this;return new c(function(){var j,h,i=[];return new f(function(){j=g.getEnumerator()},function(){while(j.moveNext()){i.length==e&&i.shift();i.push(j.current())}if(h==b)h=c.from(i).getEnumerator();return h.moveNext()?this.yieldReturn(h.current()):a},function(){d.dispose(h)})})};c.prototype.indexOf=function(d){var c=b;if(typeof d===i.Function)this.forEach(function(e,b){if(d(e,b)){c=b;return a}});else this.forEach(function(e,b){if(e===d){c=b;return a}});return c!==b?c:-1};c.prototype.lastIndexOf=function(b){var a=-1;if(typeof b===i.Function)this.forEach(function(d,c){if(b(d,c))a=c});else this.forEach(function(d,c){if(d===b)a=c});return a};c.prototype.asEnumerable=function(){return c.from(this)};c.prototype.toArray=function(){var a=[];this.forEach(function(b){a.push(b)});return a};c.prototype.toLookup=function(c,b,a){c=d.createLambda(c);b=d.createLambda(b);a=d.createLambda(a);var e=new r(a);this.forEach(function(g){var f=c(g),a=b(g),d=e.get(f);if(d!==j)d.push(a);else e.add(f,[a])});return new v(e)};c.prototype.toObject=function(b,a){b=d.createLambda(b);a=d.createLambda(a);var c={};this.forEach(function(d){c[b(d)]=a(d)});return c};c.prototype.toDictionary=function(c,b,a){c=d.createLambda(c);b=d.createLambda(b);a=d.createLambda(a);var e=new r(a);this.forEach(function(a){e.add(c(a),b(a))});return e};c.prototype.toJSONString=function(a,c){if(typeof JSON===i.Undefined||JSON.stringify==b)throw new Error("toJSONString can't find JSON.stringify. This works native JSON support Browser or include json2.js");return JSON.stringify(this.toArray(),a,c)};c.prototype.toJoinedString=function(a,c){if(a==b)a="";if(c==b)c=g.Identity;return this.select(c).toArray().join(a)};c.prototype.doAction=function(b){var e=this;b=d.createLambda(b);return new c(function(){var c,g=0;return new f(function(){c=e.getEnumerator()},function(){if(c.moveNext()){b(c.current(),g++);return this.yieldReturn(c.current())}return a},function(){d.dispose(c)})})};c.prototype.forEach=function(c){c=d.createLambda(c);var e=0,b=this.getEnumerator();try{while(b.moveNext())if(c(b.current(),e++)===a)break}finally{d.dispose(b)}};c.prototype.write=function(c,f){if(c==b)c="";f=d.createLambda(f);var g=e;this.forEach(function(b){if(g)g=a;else document.write(c);document.write(f(b))})};c.prototype.writeLine=function(a){a=d.createLambda(a);this.forEach(function(b){document.writeln(a(b)+"<br />")})};c.prototype.force=function(){var a=this.getEnumerator();try{while(a.moveNext());}finally{d.dispose(a)}};c.prototype.letBind=function(b){b=d.createLambda(b);var e=this;return new c(function(){var g;return new f(function(){g=c.from(b(e)).getEnumerator()},function(){return g.moveNext()?this.yieldReturn(g.current()):a},function(){d.dispose(g)})})};c.prototype.share=function(){var i=this,c,h=a;return new s(function(){return new f(function(){if(c==b)c=i.getEnumerator()},function(){if(h)throw new Error(l);return c.moveNext()?this.yieldReturn(c.current()):a},g.Blank)},function(){h=e;d.dispose(c)})};c.prototype.memoize=function(){var j=this,h,c,i=a;return new s(function(){var d=-1;return new f(function(){if(c==b){c=j.getEnumerator();h=[]}},function(){if(i)throw new Error(l);d++;return h.length<=d?c.moveNext()?this.yieldReturn(h[d]=c.current()):a:this.yieldReturn(h[d])},g.Blank)},function(){i=e;d.dispose(c);h=b})};c.prototype.catchError=function(b){b=d.createLambda(b);var e=this;return new c(function(){var c;return new f(function(){c=e.getEnumerator()},function(){try{return c.moveNext()?this.yieldReturn(c.current()):a}catch(d){b(d);return a}},function(){d.dispose(c)})})};c.prototype.finallyAction=function(b){b=d.createLambda(b);var e=this;return new c(function(){var c;return new f(function(){c=e.getEnumerator()},function(){return c.moveNext()?this.yieldReturn(c.current()):a},function(){try{d.dispose(c)}finally{b()}})})};c.prototype.log=function(a){a=d.createLambda(a);return this.doAction(function(b){typeof console!==i.Undefined&&console.log(a(b))})};c.prototype.trace=function(c,a){if(c==b)c="Trace";a=d.createLambda(a);return this.doAction(function(b){typeof console!==i.Undefined&&console.log(c,a(b))})};var k=function(f,b,c,e){var a=this;a.source=f;a.keySelector=d.createLambda(b);a.descending=c;a.parent=e};k.prototype=new c;k.prototype.createOrderedEnumerable=function(a,b){return new k(this.source,a,b,this)};k.prototype.thenBy=function(b){return this.createOrderedEnumerable(b,a)};k.prototype.thenByDescending=function(a){return this.createOrderedEnumerable(a,e)};k.prototype.getEnumerator=function(){var h=this,d,c,e=0;return new f(function(){d=[];c=[];h.source.forEach(function(b,a){d.push(b);c.push(a)});var a=p.create(h,b);a.GenerateKeys(d);c.sort(function(b,c){return a.compare(b,c)})},function(){return e<c.length?this.yieldReturn(d[c[e++]]):a},g.Blank)};var p=function(c,d,e){var a=this;a.keySelector=c;a.descending=d;a.child=e;a.keys=b};p.create=function(a,d){var c=new p(a.keySelector,a.descending,d);return a.parent!=b?p.create(a.parent,c):c};p.prototype.GenerateKeys=function(d){var a=this;for(var f=d.length,g=a.keySelector,e=new Array(f),c=0;c<f;c++)e[c]=g(d[c]);a.keys=e;a.child!=b&&a.child.GenerateKeys(d)};p.prototype.compare=function(e,f){var a=this,c=d.compare(a.keys[e],a.keys[f]);return c==0?a.child!=b?a.child.compare(e,f):d.compare(e,f):a.descending?-c:c};var s=function(a,b){this.dispose=b;c.call(this,a)};s.prototype=new c;var h=function(a){this.getSource=function(){return a}};h.prototype=new c;h.prototype.any=function(a){return a==b?this.getSource().length>0:c.prototype.any.apply(this,arguments)};h.prototype.count=function(a){return a==b?this.getSource().length:c.prototype.count.apply(this,arguments)};h.prototype.elementAt=function(a){var b=this.getSource();return 0<=a&&a<b.length?b[a]:c.prototype.elementAt.apply(this,arguments)};h.prototype.elementAtOrDefault=function(c,a){if(a===j)a=b;var d=this.getSource();return 0<=c&&c<d.length?d[c]:a};h.prototype.first=function(d){var a=this.getSource();return d==b&&a.length>0?a[0]:c.prototype.first.apply(this,arguments)};h.prototype.firstOrDefault=function(e,a){if(a===j)a=b;if(e!=b)return c.prototype.firstOrDefault.apply(this,arguments);var d=this.getSource();return d.length>0?d[0]:a};h.prototype.last=function(d){var a=this.getSource();return d==b&&a.length>0?a[a.length-1]:c.prototype.last.apply(this,arguments)};h.prototype.lastOrDefault=function(e,a){if(a===j)a=b;if(e!=b)return c.prototype.lastOrDefault.apply(this,arguments);var d=this.getSource();return d.length>0?d[d.length-1]:a};h.prototype.skip=function(d){var b=this.getSource();return new c(function(){var c;return new f(function(){c=d<0?0:d},function(){return c<b.length?this.yieldReturn(b[c++]):a},g.Blank)})};h.prototype.takeExceptLast=function(a){if(a==b)a=1;return this.take(this.getSource().length-a)};h.prototype.takeFromLast=function(a){return this.skip(this.getSource().length-a)};h.prototype.reverse=function(){var b=this.getSource();return new c(function(){var c;return new f(function(){c=b.length},function(){return c>0?this.yieldReturn(b[--c]):a},g.Blank)})};h.prototype.sequenceEqual=function(d,e){return(d instanceof h||d instanceof Array)&&e==b&&c.from(d).count()!=this.count()?a:c.prototype.sequenceEqual.apply(this,arguments)};h.prototype.toJoinedString=function(a,e){var d=this.getSource();if(e!=b||!(d instanceof Array))return c.prototype.toJoinedString.apply(this,arguments);if(a==b)a="";return d.join(a)};h.prototype.getEnumerator=function(){var a=this.getSource(),b=-1;return{current:function(){return a[b]},moveNext:function(){return++b<a.length},dispose:g.Blank}};var n=function(b,a){this.prevSource=b;this.prevPredicate=a};n.prototype=new c;n.prototype.where=function(a){a=d.createLambda(a);if(a.length<=1){var e=this.prevPredicate,b=function(b){return e(b)&&a(b)};return new n(this.prevSource,b)}else return c.prototype.where.call(this,a)};n.prototype.select=function(a){a=d.createLambda(a);return a.length<=1?new m(this.prevSource,this.prevPredicate,a):c.prototype.select.call(this,a)};n.prototype.getEnumerator=function(){var c=this.prevPredicate,e=this.prevSource,b;return new f(function(){b=e.getEnumerator()},function(){while(b.moveNext())if(c(b.current()))return this.yieldReturn(b.current());return a},function(){d.dispose(b)})};var m=function(c,a,b){this.prevSource=c;this.prevPredicate=a;this.prevSelector=b};m.prototype=new c;m.prototype.where=function(a){a=d.createLambda(a);return a.length<=1?new n(this,a):c.prototype.where.call(this,a)};m.prototype.select=function(a){var b=this;a=d.createLambda(a);if(a.length<=1){var f=b.prevSelector,e=function(b){return a(f(b))};return new m(b.prevSource,b.prevPredicate,e)}else return c.prototype.select.call(b,a)};m.prototype.getEnumerator=function(){var e=this.prevPredicate,g=this.prevSelector,h=this.prevSource,c;return new f(function(){c=h.getEnumerator()},function(){while(c.moveNext())if(e==b||e(c.current()))return this.yieldReturn(g(c.current()));return a},function(){d.dispose(c)})};var r=function(){var d=function(a,b){return Object.prototype.hasOwnProperty.call(a,b)},h=function(a){return a===b?"null":a===j?"undefined":typeof a.toString===i.Function?a.toString():Object.prototype.toString.call(a)},m=function(d,c){var a=this;a.key=d;a.value=c;a.prev=b;a.next=b},k=function(){this.first=b;this.last=b};k.prototype={addLast:function(c){var a=this;if(a.last!=b){a.last.next=c;c.prev=a.last;a.last=c}else a.first=a.last=c},replace:function(c,a){if(c.prev!=b){c.prev.next=a;a.prev=c.prev}else this.first=a;if(c.next!=b){c.next.prev=a;a.next=c.next}else this.last=a},remove:function(a){if(a.prev!=b)a.prev.next=a.next;else this.first=a.next;if(a.next!=b)a.next.prev=a.prev;else this.last=a.prev}};var l=function(c){var a=this;a.countField=0;a.entryList=new k;a.buckets={};a.compareSelector=c==b?g.Identity:c};l.prototype={add:function(i,j){var a=this,g=a.compareSelector(i),f=h(g),c=new m(i,j);if(d(a.buckets,f)){for(var b=a.buckets[f],e=0;e<b.length;e++)if(a.compareSelector(b[e].key)===g){a.entryList.replace(b[e],c);b[e]=c;return}b.push(c)}else a.buckets[f]=[c];a.countField++;a.entryList.addLast(c)},"get":function(i){var a=this,c=a.compareSelector(i),g=h(c);if(!d(a.buckets,g))return j;for(var e=a.buckets[g],b=0;b<e.length;b++){var f=e[b];if(a.compareSelector(f.key)===c)return f.value}return j},"set":function(k,l){var b=this,g=b.compareSelector(k),j=h(g);if(d(b.buckets,j))for(var f=b.buckets[j],c=0;c<f.length;c++)if(b.compareSelector(f[c].key)===g){var i=new m(k,l);b.entryList.replace(f[c],i);f[c]=i;return e}return a},contains:function(j){var b=this,f=b.compareSelector(j),i=h(f);if(!d(b.buckets,i))return a;for(var g=b.buckets[i],c=0;c<g.length;c++)if(b.compareSelector(g[c].key)===f)return e;return a},clear:function(){this.countField=0;this.buckets={};this.entryList=new k},remove:function(g){var a=this,f=a.compareSelector(g),e=h(f);if(!d(a.buckets,e))return;for(var b=a.buckets[e],c=0;c<b.length;c++)if(a.compareSelector(b[c].key)===f){a.entryList.remove(b[c]);b.splice(c,1);if(b.length==0)delete a.buckets[e];a.countField--;return}},count:function(){return this.countField},toEnumerable:function(){var d=this;return new c(function(){var c;return new f(function(){c=d.entryList.first},function(){if(c!=b){var d={key:c.key,value:c.value};c=c.next;return this.yieldReturn(d)}return a},g.Blank)})}};return l}(),v=function(a){var b=this;b.count=function(){return a.count()};b.get=function(b){return c.from(a.get(b))};b.contains=function(b){return a.contains(b)};b.toEnumerable=function(){return a.toEnumerable().select(function(a){return new t(a.key,a.value)})}},t=function(b,a){this.key=function(){return b};h.call(this,a)};t.prototype=new h;if(typeof define===i.Function&&define.amd)define("linqjs",[],function(){return c});else if(typeof module!==i.Undefined&&module.exports)module.exports=c;else w.Enumerable=c})(this);

/*global define*/
define('scalejs.linq-linqjs',[
    'scalejs!core',
    'linqjs'
], function (
    core,
    Enumerable
) {
    

    Enumerable.Utils.extendTo(Array);

    core.registerExtension({
        linq: {
            enumerable: Enumerable
        }
    });
});


/** @license CSS.supports polyfill | @version 0.4 | MIT License | github.com/termi/CSS.supports */

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @warning_level VERBOSE
// @jscomp_warning missingProperties
// @output_file_name CSS.supports.js
// @check_types
// ==/ClosureCompiler==

/*
TODO::
1. element.style.webkitProperty == element.style.WebkitProperty in Webkit (Chrome at least), so
CSS.supporst("webkit-animation", "name") is true. Think this is wrong.
*/

;(function() {
	

	var global = window
		, _CSS_supports
		, msie
		, testElement
		, prevResultsCache
		, _CSS = global["CSS"]
	;

	if( !_CSS ) {
		_CSS = global["CSS"] = {};
	}

	// ---=== HAS CSS.supports support ===---
	_CSS_supports = _CSS.supports;

	// ---=== HAS supportsCSS support ===---
	if( !_CSS_supports && global["supportsCSS"] ) {// Opera 12.10 impl
		_CSS_supports = _CSS.supports = global["supportsCSS"].bind(global);
		if( global.__proto__ ) {
			delete global.__proto__["supportsCSS"];
		}
	}


	if(typeof _CSS_supports === "function") {
		if( (function() {
			// Test for support [supports condition](http://www.w3.org/TR/css3-conditional/#supportscondition)
			try {
				_CSS_supports.call(_CSS, "(a:a)");
				// SUCCESS
				return !(global = _CSS_supports = null);//return true
			}
			catch(e) {//FAIL
				//_CSS_supports = _CSS_supports.bind(global);
			}
		})() ) {
			// EXIT
			return;// Do not need anything to do. Exit from polyfill
		}
	}
	else {
		// ---=== NO CSS.supports support ===---

		msie = "runtimeStyle" in document.documentElement;
		testElement = global["document"].createElement("_");
		prevResultsCache = {};

		_CSS_supports = function(ToCamel_replacer, testStyle, testElement, propertyName, propertyValue) {
			var name_and_value = propertyName + "\\/" + propertyValue;
			if( name_and_value in prevResultsCache ) {
				return prevResultsCache[name_and_value];
			}

			/* TODO:: for IE < 9:
			 _ = document.documentElement.appendChild(document.createElement("_"))
			 _.currentStyle[propertyName] == propertyValue
			*/
			var __bind__RE_FIRST_LETTER = this
				, propertyName_CC = (propertyName + "").replace(__bind__RE_FIRST_LETTER, ToCamel_replacer)
			;

			var result = propertyName && propertyValue && (propertyName_CC in testStyle);

			if( result ) {
				/*if( msie ) {

					try {
						testElement.style[propertyName] = propertyValue;// IE throw here, if unsupported this syntax
						testElement.style.cssText = "";
					}
					catch(e) {
						result = false;
					}

					if( result ) {
						testElement.id = uuid;
						_document.body.appendChild(testElement);

						if( (prevPropValue = testElement.currentStyle[propertyName]) != propertyValue ) {
							_document.body.insertAdjacentHTML("beforeend", "<br style='display:none' id='" + uuid + "br'><style id='" + uuid + "style'>" +
								"#" + uuid + "{display:none;height:0;width:0;visibility:hidden;position:absolute;position:fixed;" + propertyName + ":" + propertyValue + "}" +
								"</style>");

							if( !(propertyName in testElement.currentStyle) ) {
								partOfCompoundPropName
							}

							if( /\(|\s/.test(propertyValue) ) {
								currentPropValue = testElement.currentStyle[propertyName];
								result = !!currentPropValue && currentPropValue != prevPropValue;
							}
							else {
								result = testElement.currentStyle[propertyName] == propertyValue;
							}
							//_document.documentElement.removeChild(document.getElementById(uuid + "br"));
							//_document.documentElement.removeChild(document.getElementById(uuid + "style"));
						}

						//_document.documentElement.removeChild(testElement);
					}*/

				if( msie ) {
					if( /\(|\s/.test(propertyValue) ) {
						try {
							testStyle[propertyName_CC] = propertyValue;
							result = !!testStyle[propertyName_CC];
						}
						catch(e) {
							result = false;
						}
					}
					else {
						testStyle.cssText = "display:none;height:0;width:0;visibility:hidden;position:absolute;position:fixed;" + propertyName + ":" + propertyValue;
						document.documentElement.appendChild(testElement);
						result = testElement.currentStyle[propertyName_CC] == propertyValue;
						document.documentElement.removeChild(testElement);
					}
				}
				else {
					testStyle.cssText = propertyName + ":" + propertyValue;
					result = testStyle[propertyName_CC];
					result = result == propertyValue || result && testStyle.length > 0;
				}
			}

			testStyle.cssText = "";

			return prevResultsCache[name_and_value] = result;
		}.bind(
			/(-)([a-z])/g // __bind__RE_FIRST_LETTER
			, function(a, b, c) { // ToCamel_replacer
				return c.toUpperCase()
			}
			, testElement.style // testStyle
			, msie ? testElement : null // testElement
		);
	}

	// _supportsCondition("(a:b) or (display:block) or (display:none) and (display:block1)")
	function _supportsCondition(str) {
		if(!str) {
			_supportsCondition.throwSyntaxError();
		}

		/** @enum {number} @const */
		var RMAP = {
			NOT: 1
			, AND: 2
			, OR: 4
			, PROPERTY: 8
			, VALUE: 16
			, GROUP_START: 32
			, GROUP_END: 64
		};

		var resultsStack = []
			, chr
			, result
			, valid = true
			, isNot
			, start
			, currentPropertyName
			, expectedPropertyValue
			, passThisGroup
			, nextRuleCanBe = 
				RMAP.NOT | RMAP.GROUP_START | RMAP.PROPERTY
			, currentRule
			, i = -1
			, newI
			, len = str.length
		;

		resultsStack.push(void 0);

		function _getResult() {
			var l = resultsStack.length - 1;
			if( l < 0 )valid = false;
			return resultsStack[ l ];
		}

		/**
		 * @param {string=} val
		 * @private
		 */
		function _setResult(val) {
			var l = resultsStack.length - 1;
			if( l < 0 )valid = false;
			result = resultsStack[ l ] = val;
		}

		/**
		 * @param {string?} that
		 * @param {string?} notThat
		 * @param {number=} __i
		 * @param {boolean=} cssValue
		 * @return {(number|undefined)}
		 * @private
		 */
		function _checkNext(that, notThat, __i, cssValue) {
			newI = __i || i;

			var chr
				, isQuited
				, isUrl
				, special
			;

			if(cssValue) {
				newI--;
			}

			do {
				chr = str.charAt(++newI);

				if(cssValue) {
					special = chr && (isQuited || isUrl);
					if(chr == "'" || chr == "\"") {
						special = (isQuited = !isQuited);
					}
					else if(!isQuited) {
						if(!isUrl && chr == "(") {
							// TODO:: in Chrome: $0.style.background = "url('http://asd))')"; $0.style.background == "url(http://asd%29%29/)"
							isUrl = true;
							special = true;
						}
						else if(isUrl && chr == ")") {
							isUrl = false;
							special = true;
						}
					}
				}
			}
			while(special || (chr && (!that || chr != that) && (!notThat || chr == notThat)));

			if(that == null || chr == that) {
				return newI;
			}
		}

		while(++i < len) {
			if(currentRule == RMAP.NOT) {
				nextRuleCanBe = RMAP.GROUP_START | RMAP.PROPERTY;
			}
			else if(currentRule == RMAP.AND || currentRule == RMAP.OR || currentRule == RMAP.GROUP_START) {
				nextRuleCanBe = RMAP.GROUP_START | RMAP.PROPERTY | RMAP.NOT;
			}
			else if(currentRule == RMAP.GROUP_END) {
				nextRuleCanBe = RMAP.GROUP_START | RMAP.NOT | RMAP.OR | RMAP.AND;
			}
			else if(currentRule == RMAP.VALUE) {
				nextRuleCanBe = RMAP.GROUP_END | RMAP.GROUP_START | RMAP.NOT | RMAP.OR | RMAP.AND;
			}
			else if(currentRule == RMAP.PROPERTY) {
				nextRuleCanBe = RMAP.VALUE;
			}

			chr = str.charAt(i);

			if(nextRuleCanBe & RMAP.NOT && chr == "n" && str.substr(i, 3) == "not") {
				currentRule = RMAP.NOT;
				i += 2;
			}
			else if(nextRuleCanBe & RMAP.AND && chr == "a" && str.substr(i, 3) == "and") {
				currentRule = RMAP.AND;
				i += 2;
			}
			else if(nextRuleCanBe & RMAP.OR && chr == "o" && str.substr(i, 2) == "or") {
				currentRule = RMAP.OR;
				i++;
			}
			else if(nextRuleCanBe & RMAP.GROUP_START && chr == "(" && _checkNext("(", " ")) {
				currentRule = RMAP.GROUP_START;
				i = newI - 1;
			}
			else if(nextRuleCanBe & RMAP.GROUP_END && chr == ")" && resultsStack.length > 1) {
				currentRule = RMAP.GROUP_END;
			}
			else if(nextRuleCanBe & RMAP.PROPERTY && chr == "(" && (start = _checkNext(null, " ")) && _checkNext(":", null, start)) {
				currentRule = RMAP.PROPERTY;
				i = newI - 1;
				currentPropertyName = str.substr(start, i - start + 1).trim();
				start = 0;
				expectedPropertyValue = null;
				continue;
			}
			else if(nextRuleCanBe & RMAP.VALUE && (start = _checkNext(null, " ")) && _checkNext(")", null, start, true)) {
				currentRule = RMAP.VALUE;
				i = newI;
				expectedPropertyValue = str.substr(start, i - start).trim();
				start = 0;
				chr = " ";
			}
			else if(chr == " ") {
				continue;
			}
			else {
				currentRule = 0;
			}

			if(!valid || !chr || !(currentRule & nextRuleCanBe)) {
				_supportsCondition.throwSyntaxError();
			}
			valid = true;

			if(currentRule == RMAP.OR) {
				if(result === false) {
					_setResult();
					passThisGroup = false;
				}
				else if(result === true) {
					passThisGroup = true;
				}

				continue;
			}

			if( passThisGroup ) {
				continue;
			}

			result = _getResult();

			if(currentRule == RMAP.NOT) {
				isNot = true;

				continue;
			}

			if(currentRule == RMAP.AND) {
				if(result === false) {
					passThisGroup = true;
				}
				else {
					_setResult();
				}

				continue;
			}

			if(result === false && !(currentRule & (RMAP.GROUP_END | RMAP.GROUP_START))) {
				_setResult(result);
				continue;
			}

			if( currentRule == RMAP.GROUP_START ) { // Group start
				resultsStack.push(void 0);
			}
			else if( currentRule == RMAP.GROUP_END ) { // Group end
				passThisGroup = false;

				resultsStack.pop();
				if( _getResult() !== void 0) {
					result = !!(result & _getResult());
				}

				isNot = false;
			}
			else if( currentRule == RMAP.VALUE ) { // Property value
				_setResult(_CSS_supports(currentPropertyName, expectedPropertyValue));
				if(isNot)result = !result;

				isNot = false;
				expectedPropertyValue = currentPropertyName = null;
			}

			_setResult(result);
		}

		if(!valid || result === void 0 || resultsStack.length > 1) {
			_supportsCondition.throwSyntaxError();
		}

		return result;
	}
	_supportsCondition.throwSyntaxError = function() {
		throw new Error("SYNTAX_ERR");
	};

	/**
	 * @expose
	 */
	_CSS.supports = function(a, b) {
		if(!arguments.length) {
			throw new Error("WRONG_ARGUMENTS_ERR");//TODO:: DOMException ?
		}

		if(arguments.length == 1) {
			return _supportsCondition(a);
		}

		return _CSS_supports(a, b);
	};

	global = testElement = null;// no need this any more
})();

define("CSS.supports", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.CSS;
    };
}(this)));


/*global define, document, window, console */
define('scalejs.layout-cssgrid/utils',[],function () {
    

    function safeSetStyle(element, name, value) {
        //Set values of style attribute without browser checking if they are supported
        var currentStyle,
            styleObj = {},
            result;

        if (element.hasAttribute('style')) {
            currentStyle = element.getAttribute('style');
        } else {
            currentStyle = '';
        }

        currentStyle.split(';').forEach(function (styleProperty) {
            var tokens = styleProperty.split(':'),
                propertyName,
                propertyValue;

            if (tokens.length === 2) {
                propertyName = tokens[0].trim();
                propertyValue = tokens[1].trim();

                styleObj[propertyName] = propertyValue;
            }
        });

        styleObj[name] = value;

        result = Object.keys(styleObj).select(function (key) {
            return key + ': ' + styleObj[key];
        }).toArray().join('; ');

        element.setAttribute('style', result);
    }
    function safeGetStyle(element, name) {
        //Get values of style attribute without browser checking if they are supported
        var currentStyle,
            styleObj = {};

        if (element.hasAttribute('style')) {
            currentStyle = element.getAttribute('style');
        } else {
            currentStyle = '';
        }

        currentStyle.split(';').forEach(function (styleProperty) {
            var tokens = styleProperty.split(':'),
                propertyName,
                propertyValue;

            if (tokens.length === 2) {
                propertyName = tokens[0].trim();
                propertyValue = tokens[1].trim();

                styleObj[propertyName] = propertyValue;
            }
        });

        return styleObj[name];
    }

    function camelize(str) {
        var regex = /(-[a-z])/g,
            func = function (bit) {
                return bit.toUpperCase().replace('-', '');
            };

        return typeof str === 'string'
            ? str.toLowerCase().replace(regex, func)
            : str;
    }

    function getCssValue(element, property) {
        if (element.currentStyle) {
            return element.currentStyle[camelize(property)];
        }

        if (window.getComputedStyle) {
            return window.getComputedStyle(element, null).getPropertyValue(property);
        }
    }

    function getMeasureValue(element, property) {
        var value = getCssValue(element, property);
        value = parseFloat(value, 10);

        return isNaN(value) ? 0 : Math.ceil(value);
    }

    function toArray(list, start, end) {
        /*ignore jslint start*/
        var array = [],
            i,
            result;

        for (i = list.length; i--; array[i] = list[i]) { }

        result = Array.prototype.slice.call(array, start, end);

        return result;
        /*ignore jslint end*/
    }

    function getUrl(url, callback) {
        function getRequest() {
            if (window.ActiveXObject) {
                return new window.ActiveXObject('Microsoft.XMLHTTP');
            }

            if (window.XMLHttpRequest) {
                return new window.XMLHttpRequest();
            }
        }

        var request = getRequest();
        if (request) {
            request.onreadystatechange = function () {
                if (request.readyState === 4) {
                    callback(request.responseText);
                }
            };
        }
        request.open("GET", url, true);
        request.send();
    }

    return {
        camelize: camelize,
        getCssValue: getCssValue,
        getMeasureValue: getMeasureValue,
        toArray: toArray,
        getUrl: getUrl,
        safeSetStyle: safeSetStyle,
        safeGetStyle: safeGetStyle
    };
});
/*global define, require, document, console*/
/*jslint regexp: true */
define('scalejs.layout-cssgrid/utils.sheetLoader',[
    'cssparser',
    './utils'
], function (
    cssParser,
    utils
) {
    

    var toArray = utils.toArray,
        getUrl  = utils.getUrl;

    function loadStyleSheet(url, loadedStyleSheets, onLoaded) {
        if (loadedStyleSheets.hasOwnProperty(url)) {
            return;
        }

        loadedStyleSheets[url] = null;

        getUrl(url, function (stylesheet) {
            var parsed;

            if (stylesheet.length === 0) {
                parsed = {
                    rulelist: []
                };
            } else {
                parsed = cssParser.parse(stylesheet);
            }

            loadedStyleSheets[url] = parsed;

            (parsed.imports || []).forEach(function (cssImport) {
                loadStyleSheet(cssImport['import'].replace(/['"]/g, ''), loadedStyleSheets, onLoaded);
            });

            onLoaded();
        });
    }

    function loadAllStyleSheets(onLoaded) {
        var loadedStyleSheets = {},
            styleSheets = toArray(document.styleSheets),
            hrefExists,
            allHtml = document.documentElement.innerHTML,
            removeComments = /<!--(.|\n|\r)*-->/gm,
            getStyles = /<style.*?>((.|\n|\r)*?)<\/style>/gm,
            headerStyles = [],
            match;

        // collects styles from html

        // clean out comments to remove commented out styles
        allHtml.replace(removeComments, '');

        // extract contents of style tags
        while (true) {
            match = getStyles.exec(allHtml);
            if (!match) {
                break;
            }

            headerStyles.push(match[1]);
        }

        headerStyles.forEach(function (styleText, i) {
            var parsed;

            if (styleText.length === 0) {
                parsed = {
                    rulelist: []
                };
            } else {
                parsed = cssParser.parse(styleText);
            }

            loadedStyleSheets['head' + i] = parsed;
        });

        // if no styleSheets have href, call onLoaded
        hrefExists = styleSheets.some(function (s) {
            return s.href;
        });

        if (!hrefExists) {
            onLoaded(loadedStyleSheets);
        }

        toArray(document.styleSheets)
            .forEach(function (sheet) {
                if (sheet.href) {
                    loadStyleSheet(sheet.href, loadedStyleSheets, function () {
                        //console.log(sheet.href, loadedStyleSheets);
                        var url;
                        for (url in loadedStyleSheets) {
                            if (loadedStyleSheets.hasOwnProperty(url)) {
                                if (loadedStyleSheets[url] === null) {
                                    return;
                                }
                            }
                        }

                        onLoaded(loadedStyleSheets);
                    });
                }
            });
    }
    /* Removed due to conflict with fabric code using 'in' with object prototype.
    Object.getPrototypeOf(cssParser).parseError = function (error, details) {
        console.log(error, details);
    };*/

    return {
        loadAllStyleSheets: loadAllStyleSheets
    };
});


define('scalejs.layout-cssgrid/gridTracksParser',[], function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"start":3,"tokens":4,"EOF":5,"t":6,"SPACE":7,"NUMBER":8,"PX":9,"FR":10,"AUTO":11,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"SPACE",8:"NUMBER",9:"PX",10:"FR",11:"AUTO"},
productions_: [0,[3,2],[4,1],[4,3],[6,0],[6,2],[6,2],[6,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1: 
            var result = $$[$0-1]
                .filter(function (track) { return track; })
                .map(function (track, i) { track.index = i + 1; return track; });
            //console.log(result);
            return result;
        
break;
case 2: this.$ = [$$[$0]]; 
break;
case 3: 
            this.$ = $$[$0-2].concat($$[$0]); 
        
break;
case 5: this.$ = { type: 'px', size : parseInt($$[$0-1], 10) }; 
break;
case 6: this.$ = { type: 'fr', size: parseInt($$[$0-1], 10) }; 
break;
case 7: this.$ = { type: 'keyword', size : 'auto' }; 
break;
}
},
table: [{3:1,4:2,5:[2,4],6:3,7:[2,4],8:[1,4],11:[1,5]},{1:[3]},{5:[1,6],7:[1,7]},{5:[2,2],7:[2,2]},{9:[1,8],10:[1,9]},{5:[2,7],7:[2,7]},{1:[2,1]},{5:[2,4],6:10,7:[2,4],8:[1,4],11:[1,5]},{5:[2,5],7:[2,5]},{5:[2,6],7:[2,6]},{5:[2,3],7:[2,3]}],
defaultActions: {6:[2,1]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                this.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.2.1 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input) {
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 7
break;
case 1:return 8
break;
case 2:return 11
break;
case 3:return 9
break;
case 4:return 10
break;
case 5:return 5
break;
}
},
rules: [/^(?:\s+)/,/^(?:[0-9]+)/,/^(?:[aA][uU][tT][oO])/,/^(?:[pP][xX])/,/^(?:[fF][rR])/,/^(?:$)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
return parser;
});
/*global define, document, window, console */
define('scalejs.layout-cssgrid/gridLayout',[
    './gridTracksParser',
    './utils',
    'scalejs.linq-linqjs'
], function (
    gridTracksParser,
    utils
) {
    

    var GRIDCOLUMN = 'grid-column',
        GRIDCOLUMNS = 'grid-columns',
        GRIDCOLUMNSPAN = 'grid-column-span',
        GRIDROW = 'grid-row',
        GRIDROWS = 'grid-rows',
        GRIDROWSPAN = 'grid-row-span',
        KEYWORD = 'keyword',
        FR = 'fr',
        AUTO = 'auto',
        PX = 'px',
        TOP = 'top',
        RIGHT = 'right',
        BOTTOM = 'bottom',
        LEFT = 'left',
        WIDTH = 'width',
        HEIGHT = 'height',
        MARGIN = 'margin',
        PADDING = 'padding',
        BORDER = 'border',
        HYPHEN = '-',
        getMeasureValue = utils.getMeasureValue;


    function addItemToTracks(tracks, itemTracks, item, firstTrack, lastTrack) {
        tracks
            .filter(function (track) { return track.index >= firstTrack && track.index <= lastTrack; })
            .forEach(function (track) {
                if (track.items === undefined) {
                    track.items = [];
                }
                track.items.push(item);
                itemTracks.push(track);
            });
    }

    function mapGridItemsToTracks(gridItems, columnTracks, rowTracks) {
        return gridItems.map(function (curItem) {
            var newItem = {};

            newItem.column = parseInt(curItem.details.properties[GRIDCOLUMN], 10);

            if (isNaN(newItem.column)) {
                newItem.column = 1;
            }

            newItem.columnSpan = parseInt(curItem.details.properties[GRIDCOLUMNSPAN], 10);
            if (isNaN(newItem.columnSpan)) {
                newItem.columnSpan = 1;
            }

            newItem.row = parseInt(curItem.details.properties[GRIDROW], 10);
            if (isNaN(newItem.row)) {
                newItem.row = 1;
            }

            newItem.rowSpan = parseInt(curItem.details.properties[GRIDROWSPAN], 10);
            if (isNaN(newItem.rowSpan)) {
                newItem.rowSpan = 1;
            }

            newItem.element = curItem.element;
            newItem.styles = curItem.details;
            newItem.columnTracks = [];
            newItem.rowTracks = [];

            addItemToTracks(columnTracks, newItem.columnTracks, newItem, newItem.column, newItem.column + newItem.columnSpan - 1);
            addItemToTracks(rowTracks, newItem.rowTracks, newItem, newItem.row, newItem.row + newItem.rowSpan - 1);

            return newItem;
        });
    }

    function frameSize(element, dimension) {
        var sides = dimension === WIDTH ? [RIGHT, LEFT] : [TOP, BOTTOM],
            size;

        size = sides.reduce(function (result, side) {
            return result +
                getMeasureValue(element, MARGIN + HYPHEN + side) +
                getMeasureValue(element, PADDING + HYPHEN + side) +
                getMeasureValue(element, BORDER + HYPHEN + side + HYPHEN + WIDTH);
        }, 0);

        return size;
    }

    function pxTracks(tracks) {
        return tracks
            .filter(function (track) { return track.type === PX; })
            .reduce(function (size, track) {
                track.pixels = track.size;
                return size + track.pixels;
            }, 0);
    }

    function autoTracks(tracks, dimension) {
        return tracks
            .filter(function (track) { return track.type === KEYWORD && track.size === AUTO && track.items; })
            .reduce(function (size, track) {
                var noFrItems,
                    trackSize,
                    offsetProperty = 'offset' + (dimension === WIDTH ? 'Width' : 'Height'),
                    tracksProperty = (dimension === WIDTH ? 'column' : 'row') + 'Tracks',
                    trackSizes;
                // find first item that has no FR rows.
                // Then use it's size to determine track size.
                noFrItems = track.items.filter(function (item) {
                    return item[tracksProperty].reduce(function (r, tr) {
                        return r && tr.type !== FR;
                    }, true);
                });

                /* MATCHES FIRST ELEMENT IN AUTO TRACK
                noFrItem = noFrItems[0]; 
                if (noFrItem) {
                    //trackSize = getMeasureValue(noFrItem.element, dimension) + frameSize(noFrItem.element, dimension);
                    trackSize = Math.ceil(parseFloat(noFrItem.element.style[dimension], 10)) + frameSize(noFrItem.element, dimension);
                    if (isNaN(trackSize)) {
                        noFrItem.element.style[dimension] = '';
                        trackSize = noFrItem.element[offsetProperty];
                    }
                    // set it to 0 so that reduce would properly calculate
                    track.pixels = 0;
                    track.pixels = noFrItem[tracksProperty].reduce(function (r, tr) { return r - tr.pixels; }, trackSize);
                } else {
                    track.pixels = 0;
                }*/

                trackSizes = noFrItems
                    .select(function (noFrItem) {
                        var ceil = Math.ceil(parseFloat(noFrItem.element.style[dimension], 10)),
                            frameSz = frameSize(noFrItem.element, dimension),
                            track_pixels;
                        trackSize = ceil + frameSz;
                        if (isNaN(trackSize)) {
                            noFrItem.element.style[dimension] = '';
                            trackSize = noFrItem.element[offsetProperty];
                        }
                            // set it to 0 so that reduce would properly calculate
                        track_pixels = 0;
                        track_pixels = noFrItem[tracksProperty].reduce(function (r, tr) { return r - ((tr.pixels !== undefined) ? (tr.pixels) : (0)); }, trackSize);

                        return track_pixels;

                    }).toArray();

                if (trackSizes !== undefined && trackSizes.length > 0) {
                    track.pixels = trackSizes.max();
                } else {
                    track.pixels = 0;
                }

                return size + track.pixels;
            }, 0);
    }

    function frTracks(tracks, size) {
        var frs,
            totalFRs;

        frs = tracks.filter(function (track) { return track.type === FR; });
        totalFRs = frs.reduce(function (sum, track) { return sum + track.size; }, 0);

        frs.forEach(function (track) {
            var planned_size = size * track.size / totalFRs;
            track.pixels = Math.max(0, planned_size);
        });
    }

    function sizeTracks(tracks, size, dimension) {
        size -= pxTracks(tracks);
        size -= autoTracks(tracks, dimension);

        frTracks(tracks, size);
    }

    /*jslint unparam:true*/
    return function gridLayout(gridElement, properties, media, gridItems) {
        var columnTracks,
            rowTracks,
            mappedItems,
            prevParentPos;

        columnTracks = gridTracksParser.parse(properties[GRIDCOLUMNS]);
        rowTracks = gridTracksParser.parse(properties[GRIDROWS]);

        mappedItems = mapGridItemsToTracks(gridItems, columnTracks, rowTracks);

        sizeTracks(columnTracks, gridElement.offsetWidth, WIDTH);
        sizeTracks(rowTracks, gridElement.offsetHeight, HEIGHT);
        //console.log(width, height);

        prevParentPos = utils.safeGetStyle(gridElement, 'position');
        if (prevParentPos === 'relative') {
            utils.safeSetStyle(gridElement, 'position', 'absolute');
        } else {
            utils.safeSetStyle(gridElement, 'position', 'relative');
        }

        //gridElement.style.position = 'relative';
        //console.log('--->' + properties[GRIDROWS]);
        //console.log(gridTracksParser.parse(properties[GRIDROWS]));
        //console.log('-->gridLayout', gridElement, properties, grid_items);
        mappedItems.forEach(function (item) {
            var width,
                height,
                left,
                top,
                trackWidth,
                trackHeight,
                trackLeft,
                trackTop,
                itemWidth,
                itemHeight;

            utils.safeSetStyle(item.element, 'position', 'absolute');

            trackWidth = columnTracks
                .filter(function (track) { return track.index >= item.column && track.index < item.column + item.columnSpan; })
                .reduce(function (sum, track) { return sum + track.pixels; }, 0);

            trackHeight = rowTracks
                .filter(function (track) { return track.index >= item.row && track.index < item.row + item.rowSpan; })
                .reduce(function (sum, track) { return sum + track.pixels; }, 0);

            trackLeft = columnTracks
                .filter(function (track) { return track.index < item.column; })
                .reduce(function (sum, track) { return sum + track.pixels; }, 0);

            trackTop = rowTracks
                .filter(function (track) { return track.index < item.row; })
                .reduce(function (sum, track) { return sum + track.pixels; }, 0);


            itemWidth = parseInt(item.element.style.width, 10);
            itemHeight = parseInt(item.element.style.height, 10);


            if (item.styles.properties['grid-row-align'] === 'stretch') {
                height = trackHeight;
                top = trackTop;
            } else if (item.styles.properties['grid-row-align'] === 'start') {
                height = itemHeight;
                top = trackTop;
            } else if (item.styles.properties['grid-row-align'] === 'end') {
                height = itemHeight;
                top = trackTop + trackHeight - height;
            } else if (item.styles.properties['grid-row-align'] === 'center') {
                height = itemHeight;
                top = trackTop + (trackHeight - height) / 2;
            } else {
                console.log('invalid -ms-grid-row-align property for ', item);
            }

            if (item.styles.properties['grid-column-align'] === 'stretch') {
                width = trackWidth;
                left = trackLeft;
            } else if (item.styles.properties['grid-column-align'] === 'start') {
                width = itemWidth;
                left = trackLeft;
            } else if (item.styles.properties['grid-column-align'] === 'end') {
                width = itemWidth;
                left = trackLeft + trackWidth - width;
            } else if (item.styles.properties['grid-column-align'] === 'center') {
                width = itemWidth;
                left = trackLeft + (trackWidth - width) / 2;
            } else {
                console.log('invalid -ms-grid-column-align property for ', item);
            }

            width -= frameSize(item.element, WIDTH);
            height -= frameSize(item.element, HEIGHT);

            /*
            //width -= frameSize(item.element, WIDTH);
            //height -= frameSize(item.element, HEIGHT);
            left -= frameSize(item.element, WIDTH);
            top -= frameSize(item.element, HEIGHT);
            */

            //console.log(item.element.id, width, height);

            utils.safeSetStyle(item.element, 'width', width + PX);
            utils.safeSetStyle(item.element, 'height', height + PX);
            utils.safeSetStyle(item.element, 'left', left + PX);
            utils.safeSetStyle(item.element, 'top', top + PX);
        });
    };
});
/*global define, require, document, console, window, clearTimeout, setTimeout */
define('scalejs.layout-cssgrid/cssGridLayout',[
    'scalejs!core',
    './utils.sheetLoader',
    './gridLayout',
    './utils',
    'CSS.supports',
    'scalejs.linq-linqjs'
], function (
    core,
    sheetLoader,
    gridLayout,
    utils,
    css
) {
    

    var cssGridRules,
        cssGridSelectors,
        merge = core.object.merge,
        listeners = [];

    function onLayoutDone(callback) {
        core.array.addOne(listeners, callback);

        return function () {
            core.array.removeOne(listeners, callback);
        };
    }

    function notifyLayoutDone(gridElement) {
        listeners.forEach(function (l) {
            l(gridElement);
        });
    }

    /*jslint unparam:true*/
    function doLayout(containerNode) {
        //if nothing is passed, does layout for whole page. Otherwise, only redoes layout for containerNode and children of containerNode

        var gridElements,
            defaultGridProperties = {
                'display': 'grid',
                'grid-rows': 'auto',
                'grid-columns': 'auto'
            },
            defaultGridItemProperties = {
                'grid-row': '1',
                'grid-row-align': 'stretch',
                'grid-row-span': '1',
                'grid-column': '1',
                'grid-column-align': 'stretch',
                'grid-column-span': '1'
            };


        function createOverride(f, propertyNames) {
            var result = {};

            propertyNames
                .forEach(function (p) {
                    var v = f(p);
                    if (v !== undefined) {
                        result[p] = f(p);
                    }
                });

            return result;
        }

        function createCssGridOverride(gridElement, propertyNames) {
            // save rules that match the gridElement (parent grid rules only)
            var override,
                matchedRules = cssGridSelectors
                    .filter(function (rule) {
                        return utils.toArray(document.querySelectorAll(rule.selector))
                            .any(function (match) {
                                return gridElement === match;
                            });
                    });

            override = createOverride(function (property) {
                var rulesWithProperty = matchedRules
                    // list of rules with itemProperty defined
                    .filter(function (matchedRule) {
                        return (matchedRule.properties[property] !== undefined);
                    });

                // warning about css conflicts
                if (rulesWithProperty.length > 1) {
                    console.log('WARNING: gridElement ', gridElement, ' matched to multiple rules with property "' + property + '".' +
                                'Will use the rule ', rulesWithProperty[0]);
                }

                if (rulesWithProperty.length > 0) {
                    return rulesWithProperty[0].properties[property];
                }
            }, propertyNames);

            return override;
        }

        function createCssGridItemOverride(gridItemElement, propertyNames) {
            // for each grid rule, save it if it matches the element
            var override,
                matchedItemRules = cssGridRules
                    /*
                    // filter out parent rules (rules present in cssGridSelectors)
                    .filter(function (rule) {
                        return !cssGridSelectors.any(function (gridSelector) {
                            return gridSelector === rule;
                        });
                    })*/
                    // filter to rules that match gridItemElement
                    .filter(function (rule) {
                        var matchedElements = utils.toArray(document.querySelectorAll(rule.selector));
                        return matchedElements.any(function (match) {
                            return gridItemElement === match;
                        });
                    });


            override = createOverride(function (itemProperty) {
                var rulesWithProperty = matchedItemRules
                    // list of rules with itemProperty defined
                    .filter(function (matchedItemRule) {
                        return (matchedItemRule.properties[itemProperty] !== undefined);
                    });

                // warning about css conflicts
                if (rulesWithProperty.length > 1) {
                    console.log('WARNING: gridItemElement ' + gridItemElement + ' matched to multiple rules with property "' + itemProperty + '".' +
                                'Will use the rule ', rulesWithProperty[0]);
                }

                if (rulesWithProperty.length > 0) {
                    return rulesWithProperty[0].properties[itemProperty];
                }
            }, propertyNames);

            return override;
        }

        function createStyleGridOverride(gridElement) {
            // extract grid properties from inline style, add to gridProperties
            var gridElementStyle = gridElement.getAttribute("style"),
                override = {};

            if (!gridElementStyle) {
                return;
            }

            gridElementStyle.split('; ').forEach(function (styleProperty) {
                var tokens = styleProperty.split(':'),
                    propertyName,
                    propertyValue;

                if (tokens.length === 2) {
                    propertyName = tokens[0].trim();
                    propertyValue = tokens[1].trim();

                    if (propertyName.indexOf('-ms-grid') === 0) {
                        override[propertyName.substring(4)] = propertyValue;
                    }
                }
            });

            return override;
        }


       // get the list of unique grids (a grid can be matched to more than one style rule therefore distinct)
        gridElements = cssGridSelectors // if this is undefined, you need to call invalidate with reparse: true for the first time
            .selectMany(function (gridSelector) {
                //if a containerNode
                var container = containerNode || document.body;
                return container.parentNode.querySelectorAll(gridSelector.selector);
            })
            .distinct()
            .toArray();



        // for each grid parent, properties from each source (style>data attribute>css<defaults)
        gridElements
            .forEach(function (gridElement) {
                var cssGridProperties,
                    styleGridProperties,
                    gridProperties,
                    gridItemData = [];

                cssGridProperties = createCssGridOverride(gridElement, Object.keys(defaultGridProperties));
                styleGridProperties = createStyleGridOverride(gridElement);

                gridProperties = merge(defaultGridProperties, cssGridProperties, styleGridProperties);

                //copy whatever your final rules are to the style attribute of the grid parent so they can be modified by a splitter
                utils.safeSetStyle(gridElement, '-ms-grid-rows', gridProperties['grid-rows']);
                utils.safeSetStyle(gridElement, '-ms-grid-columns', gridProperties['grid-columns']);


                // for all children of gridElement, merge properties from each source (style > data attribute > css > defaults)
                utils.toArray(gridElement.children)
                    .forEach(function (gridItemElement) {
                        var cssGridItemProperties,
                            styleGridItemProperties,
                            gridItemProperties;

                        cssGridItemProperties = createCssGridItemOverride(gridItemElement, Object.keys(defaultGridItemProperties));
                        styleGridItemProperties = createStyleGridOverride(gridItemElement);

                        gridItemProperties = merge(defaultGridItemProperties, cssGridItemProperties, styleGridItemProperties);

                        //copy whatever your final rules are to the style attribute of the grid parent so they can be modified by a splitter
                        utils.safeSetStyle(gridItemElement, '-ms-grid-row', gridItemProperties['grid-row']);
                        utils.safeSetStyle(gridItemElement, '-ms-grid-column', gridItemProperties['grid-column']);


                        gridItemData.push({
                            element: gridItemElement,
                            details: { properties: gridItemProperties }
                        });
                    });


                gridLayout(gridElement, gridProperties, 'screen', gridItemData);

                notifyLayoutDone(gridElement);
            });

    }


    function parseAllStyles(onLoaded) {
        sheetLoader.loadAllStyleSheets(function (stylesheets) {

            cssGridRules = Object.keys(stylesheets)
                .reduce(function (acc, url) {
                    var sheet = stylesheets[url];
                    return acc.concat(sheet.rulelist);
                }, [])
                .filter(function (rule) {
                    var declarations = rule.declarations;

                    if (rule.type !== 'style' || !declarations) { return false; }

                    return Object.keys(declarations).some(function (property) {
                        return property.indexOf('-ms-grid') === 0;
                    });
                })
                .map(function (rule) {
                    var e = {};

                    e.selector = rule.selector;
                    e.media = 'screen';
                    e.properties = {};
                    Object.keys(rule.declarations).forEach(function (property) {
                        var value = rule.declarations[property];
                        if (property.indexOf('-ms-grid') === 0) {
                            e.properties[property.substring(4)] = value;
                        } else if (property === 'display' && value === '-ms-grid') {
                            e.properties.display = 'grid';
                        } else {
                            e.properties[property] = value;
                        }
                    });

                    return e;
                });

            cssGridSelectors = cssGridRules.filter(function (rule) {
                return rule.properties.display === 'grid';
            });

            onLoaded();
        });
    }

    function invalidate(options) {
        var thing,
            On;

        if (options && options.container) {
            On = options.container;
        } else {
            On = undefined;
        }

        if (options && options.reparse && (options.reparse === true)) {
            thing = function (on) {
                parseAllStyles(function () {
                    doLayout(on);
                });
            };
        } else {
            thing = function (on) {
                doLayout(on);
            };
        }

        thing(On);
    }

    return {
        doLayout: doLayout,
        invalidate: invalidate,
        onLayoutDone: onLayoutDone,
        notifyLayoutDone: notifyLayoutDone
    };
});

/*global define */
/*global window */
define('scalejs.layout-cssgrid',[
    'scalejs!core',
    './scalejs.layout-cssgrid/cssGridLayout',
    'CSS.supports',
    './scalejs.layout-cssgrid/utils'
], function (
    core,
    cssGridLayout,
    css,
    utils
) {
    

    var exposed_invalidate;


    //console.log('is -ms-grid supported? ' + (css.supports('display', '-ms-grid') || false));
    if (!css.supports('display', '-ms-grid')) {
        //register resize here
        window.addEventListener('resize', function () {
            setTimeout(function () {
                cssGridLayout.doLayout();
            }, 0);

        });

        exposed_invalidate = cssGridLayout.invalidate;

    } else {
        window.addEventListener('resize', function () {
            cssGridLayout.notifyLayoutDone();
        });

        exposed_invalidate = function () {
            cssGridLayout.notifyLayoutDone();
        };
    }

    core.registerExtension({
        layout: {
            invalidate: exposed_invalidate,
            onLayoutDone: cssGridLayout.onLayoutDone,
            utils: {
                safeSetStyle: utils.safeSetStyle,
                safeGetStyle: utils.safeGetStyle
            }
        }
    });
});


/*global require,window */
require([
    'scalejs!core',
    'domReady',
    'scalejs.layout-cssgrid'
], function (
    core,
    domReady
) {
    

    window.layout = {
        invalidate: core.layout.invalidate,
        onLayoutDone: core.layout.onLayoutDone
    };

    domReady(function () {
        core.layout.invalidate({
            reparse: true
        });
    });
});


define("app/app", function(){});
