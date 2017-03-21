wyvern.define([wyvern.templating.engine], function (templator) {

    "use strict";

    var cache = {};
    var lookup = {};

    var clearNodes = function (node) {
        while (node.childNodes.length)
            node.removeChild(node.childNodes[0]);
    }

    var buildView = function (node, content, model, registerModel) {
        var nodes = templator(content, model);
        clearNodes(node);
        while (nodes.length) {
            node.appendChild(nodes[0]);
        }
        lookup[model] = lookup[model] || { instances: [], model: model };
        if (registerModel) {
            lookup[model].instances.push({
                target: node,
                content: content
            });
        }
    }

    // Load (and cache) a view.  If the node is given, will replace the node's content with the view's content //
    var view = function (name, node, model) {
        var path = wyvern.path.view + name + ".html";
        if (typeof cache[name] === 'undefined') {
            wyvern.ajax(path + '?_nocache=' + new Date().getTime(), "GET").onComplete(function (text) {
                cache[name] = { content: text };
                if (node)
                    buildView(node, text, model, true);
            });
        }
        else {
            if (node)
                buildView(node, cache[name].content, model, true);
        }
    }

    // Refresh a model.  This will reload any views attached the model //
    view.refresh = function (model) {
        lookup[model] = lookup[model];
        if (lookup[model] && lookup[model].instances) {
            for (var i = 0; i < lookup[model].instances.length; i++) {
                var instance = lookup[model].instances[i];
                if (model == lookup[model].model && instance.target && instance.content) {
                    buildView(instance.target, instance.content, model);
                }
            }
        }
    }

    // Return our view function //
    return view;

})