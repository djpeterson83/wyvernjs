wyvern.define(function () {

    var execute = function (node, seconds, callback, valueFunc) {
        valueFunc = valueFunc || function (v) { return v; }
        var value = 0;
        var step = 0.01 / seconds;
        var iteration = function (item) { callback(item, valueFunc(value)); }

        var interval = setInterval(function () {
            iteration(node);
            value = Math.min(value + step, 1.0);
            if (value >= 1.0) {
                iteration(node);
                clearInterval(interval);
            }
        }, 10);
    }

    return {
        // Calls a callback linearly for a given duration.  Passes the progress as a float between 0 and 1 as first argument //
        linear: function (seconds, callback, node) {
            execute(seconds, callback, function (value) { return value; });
        },
        // Fades an element in for a given duration //
        linearFadeIn: function (seconds, complete, node) {
            execute(node, seconds, function (node, value) { node.style.opacity = value; if (value === 1 && typeof complete === 'function') complete();  }, function (value) { return value; });
        },
        // Fades an element out for a given duration //
        linearFadeOut: function (seconds, complete, node) {
            execute(node, seconds, function (node, value) { node.style.opacity = value; if (value === 1 && typeof complete === 'function') complete(); }, function (value) { return 1 - value; });
        }
    }
});