/*global define, document, window, console */
define(function () {
    'use strict';

    var profile,
        activeProfiles,
        self;

    function reset() {
        profile = {
            name: 'Profiler',
            profiles: []
        };
        activeProfiles = [profile];
    }

    function caller(n) {
        n = n || 0;
        var err = new Error(),
            caller_line = err.stack.split("\n")[3 + n],
            index = caller_line.indexOf("at "),
            clean = caller_line.slice(index + 2, caller_line.length);

        return clean;
    }

    function start(n) {
        var name = caller(n),
            profile = {
                name: name,
                start: new Date().getTime(),
                profiles: []
            };
        activeProfiles[activeProfiles.length - 1].profiles.push(profile);
        activeProfiles.push(profile);
    }

    function prepend(indent) {
        var arr = [];
        arr.length = indent + 1;
        return "\n" + arr.join(' ');
    }

    function stop() {
        function loop(profile, indent) {
            var delta = profile.start && profile.finish
                    ? ': ' + (profile.finish - profile.start)
                    : '',
                current = prepend(indent) + profile.name + delta;
            profile.profiles.forEach(function (sw) {
                current += loop(sw, indent + 2);
            });
            return current;
        }

        var profile = activeProfiles.pop(),
            report;

        profile.finish = new Date().getTime();

        if (activeProfiles.length === 1) {
            report = loop(activeProfiles[0], 0);
            reset();

            console.debug(report);
        }
    }

    function item() {
        stop();
        start(1);
    }

    reset();

    self = {
        start: start,
        item: item,
        stop: stop
    };

    window.profiler = self;

    return self;
});