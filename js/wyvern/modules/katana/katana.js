wyvern.define(function () {
    "use strict";

    var katana = function (input, model, target) {

        var parse = function (input) {

            var line = 0;
            var lines = input.split(/\r?\n/);
            var fb = "var _$t = \"\";\n";
            fb += "with (data) {\n"

            var tokenIs = function (value) {
                var result = lines[line].match(/^\s*(@?[a-zA-Z_]+)/);
                return result !== null && result[1] === value;
            }

            var statements = [];

            var it = 0;
            while (line < lines.length) {
                (function (inst) {
                    var tr = inst.trim();

                    if (tokenIs("@each")) {
                        var expr = tr.substr("@each".length);
                        // Extract "var variable in container" sub expression //
                        var parts = expr.match(/\s*\(\s*var\s+([a-zA-Z\$_][a-zA-Z0-9\$_]*)\s+in\s+(.*)\s*\)/)
                        var iter = parts != null ? parts[1] : null;
                        var source = parts != null ? parts[2] : null;
                        if (iter === null || source === null) throw new Error("'Each' expression invalid. Expects: (var item in items). Given: " + expr);
                        fb += "(function(){\n";
                        fb += "var $container = " + source + ";\n";
                        fb += "for (var $index = 0; $index < $container.length; $index++) {\n";
                        fb += "var " + iter + " = $container[$index]\n";
                        //fb += "_$pin" + it + " = " + source + ";\n";
                        //fb += "for (var _$it" + it + " = 0; _$it" + it + " < _$pin" + it + ".length; _$it" + it + "++){\n";
                        //fb += "var " + iter + " = _$pin" + it + "[_$it" + it + "];\n";
                        //fb += "with (" + iter + ") {"
                        line++;
                        statements.push("each");
                        it++;
                    }
                    else if (tokenIs("@end")) {
                        fb += "}\n";
                        line++;
                        var stat = statements.pop();
                        if (stat == "each") {
                            fb += "})();\n";
                            it--;
                        }
                    }
                    else if (tr.length > 0 && tr[0] == '@') {
                        inst = tr.substr(1);
                        var stat = inst.match(/^([a-zA-Z$_][a-zA-Z$_0-9]*)/);
                        stat = stat !== null ? stat[1] : '[unknown]';
                        fb += inst + '{\n';
                        line++;
                        statements.push(stat);
                    }
                    else {
                        inst = "_$t += \"" + inst.replace(/(["\\])/g, function (text, cap) { return "\\" + cap; }) + "\";\n";
                        // Replaced {{tokens}} with their expressionary contents //
                        inst = inst.replace(/{{(.*?)}}/g, function (text, cap) {
                            // Revert the escaping since this is an expression //
                            cap = cap.replace(/\\([\\"])/g, function (text, cap2) { return cap2; });
                            return "\" + (" + cap + ") + \"";
                        });
                        fb += inst;
                        line++;
                    }
                })(lines[line]);
            }

            fb += "}\n";
            fb += "return _$t";

            var fn = new Function("data", fb);

            //console.log(fb);

            return {
                expand: function (model) {
                    return fn(model);
                }
            }
        }

        var parsePartialHtml = function (text) {
            var parser = new DOMParser();
            var doc = parser.parseFromString("<html><body>" + text + "</body></html>", "text/html");
            var body = doc.getElementsByTagName("body")[0];
            return body.childNodes;
        }

        var nodes = parsePartialHtml(parse(input).expand(model));
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].tagName == 'SCRIPT') {
                var script = nodes[i];
                return parsePartialHtml(script.innerText);
            }
        }
    }

    return katana;
});