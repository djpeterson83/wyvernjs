(function (global) {

    "use strict";

    var module = function () {
        var katana = function (input, model, target) {

            var parse = function (input) {

                input = input.replace(/<!--(?:.*)?-->/g, '');

                var line = 0;
                var lines = input.split(/\r?\n/);
                var fb = "var _$t = \"\";\n";
                fb += "with (data) {\n"

                var tokenIs = function (value) {
                    var result = lines[line].match(/^\s*(@?[a-zA-Z_]+)/);
                    return result !== null && result[1] === value;
                }

                var statements = [];

                var isTagged = function (text, tag) {
                    if (typeof text === 'string' && text.length > tag.length * 2)
                        return text.substr(0, tag.length) == tag && text.substr(text.length - tag.length) == tag;
                    else
                        return false;
                }

                var untag = function(text, tag) {
                    if (typeof text === 'string' && text.length >= tag.length * 2)
                        return text.substr(tag.length, text.length - tag.length * 2);
                    else
                        return text;
                }

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
                                if (isTagged(cap, '!!'))
                                    return "\" + (" + untag(cap, '!!') + ") + \""; // Unescaped {{ data }}
                                else if (isTagged(cap, '--'))
                                    return '';  // Comment {{-- comment --}}
                                else
                                    return "\" + utility.escape(" + cap + ") + \""; // Escaped {{ data }}
                            });
                            fb += inst;
                            line++;
                        }
                    })(lines[line]);
                }

                fb += "}\n";
                fb += "return _$t";

                var fn = new Function("data", "utility", fb);

                var utility = {
                    escape: function (text) {
                        return text
                            .replace(/&/g, '&amp;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#39;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/\//g, '&#x2F;')
                    }
                };


                //console.log(fb);

                return {
                    expand: function (model) {
                        return fn(model, utility);
                    }
                }
            }

            var parsePartialHtml = function (text) {
                var parser = new DOMParser();
                var doc = parser.parseFromString("<html><body>" + text + "</body></html>", "text/html");
                var body = doc.getElementsByTagName("body")[0];
                return body.childNodes;
            }

            // Add nodes to target //
            if (target && typeof target.childNodes === 'object') {
                var nodes = parsePartialHtml(parse(input).expand(model));
                while (target.childNodes.length)
                    target.removeChild(target.childNodes[0]);
                for (var i = 0; i < nodes.length; i++)
                    target.addChild(nodes[i]);
            }

            return {
                nodes: function () {
                    return parsePartialHtml(parse(input).expand(model))
                },
                text: function () {
                    return parse(input).expand(model);
                }
            };
        }

        return katana;
    }

    if (typeof define === 'function' && define.amd)
        define([], module);
    else
        global.katana = module();
    if (wyvern && typeof wyvern.define === 'function')
        wyvern.define([], module);

})(this);
