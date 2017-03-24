(function (global) {

    "use strict";

    // Constructor for a new Wyvern instance //
    var Wyvern = function (original) {
        this.internal = {};

        // Assign instance paths based on global configuration //
        this.path = Wyvern.copy(Wyvern.path, true);
        this.templating = Wyvern.copy(Wyvern.templating);

        if (typeof original === 'object') {
            for (var attr in original)
                if (original.hasOwnProperty(attr))
                    this[attr] = original[attr];
        }
    }
    Wyvern.module = {};

    // Default paths.  You can configure these after loading the wyvern.js script //
    // New Wyvern instances will use these paths, but after instantiation, they can //
    // be changed on a per-instance basis by re-assigning wyvern.modulePath/viewPath //
    Wyvern.path = {
        module: "/js/wyvern/modules/",
        view: "/js/wyvern/views/"
    };
    Wyvern.templating = {
        engine: 'katana'
    };

    // Easy to use function for using wyvern like a function //
    // Comes with some linq-like functions to help work with arrays of objects //
    Wyvern.given = function (values) {
        var result = new Wyvern();
        result.values = values == null ? [] : values;
        result.values = Array.isArray(result.values) || result.values instanceof NodeList ? result.values : [result.values];
        result.length = result.values.length;
        result.first = function () { return values.length > 0 ? values[0] : null; }
        result.last = function () { return values.length > 0 ? values[values.length - 1] : null; }
        result.push = function () { }

        result.each = function (callback) {
            for (var i = 0; i < result.values.length; i++)
                callback(result.values[i]);
            return result;
        }
        result.where = function (predicate) {
            var result = [];
            for (var i = 0; i < result.values.length; i++) {
                if (predicate(result.values[i]))
                    result.push(result.values[i]);
            }
            return wyvern(result);
        }
        result.transform = function (transformer) {
            var result = [];
            for (var i = 0; i < result.values.length; i++) {
                result.push(transformer(result.values[i]));
            }
            return wyvern(result);
        }
        result.on = function (event, callback) {
            result.each(function (item) {
                if (item !== null && typeof item !== "undefined") {
                    if (typeof item.addEventListener === 'function')
                        item.addEventListener(event, callback, false);
                    else if (typeof item.attachEvent === 'function')
                        item.attachEvent("on" + event, callback);
                    else
                        throw new Error("Cannot add event to type " + typeof item);
                }
                else {
                    throw new Error("Cannot add event to type " + typeof item);
                }
            });
            return result;
        }
        return result;

    };
    Wyvern.prototype.given = Wyvern.given;
    Wyvern.prototype.constructor = Wyvern;
    Wyvern.prototype.module = Wyvern.module;

    // Do an AJAX call to get text information //
    Wyvern.prototype.ajax = function (url, method, data, username, password) {
        // Build AJAX request //
        var xmlhttp = new XMLHttpRequest();
        var response = null;
        var complete = false;
        var finalCallback = null;
        // When the request completes, we'll call this function //
        xmlhttp.onreadystatechange = function () {
            // Check for completion //
            if (xmlhttp.readyState == XMLHttpRequest.DONE) {
                // Notify completion now //
                complete = true;
                // If successful, we'll load the text into the result (response) and call the callback function if provided by finalCallback //
                if (xmlhttp.status >= 200 && xmlhttp.status < 300) {
                    response = xmlhttp.responseText;
                    if (finalCallback) finalCallback(response, xmlhttp.status);
                }
                // All other cases are errors or not supported //
                else if (xmlhttp.status >= 300 && xmlhttp.status < 400) {
                    throw new Error("Redirect requested but not supported: " + url);
                }
                else if (xmlhttp.status >= 400 && xmlhttp.status < 500) {
                    throw new Error("Request not found: " + url);
                }
                else {
                    throw new Error("Bad request: " + url);
                }
            }
        }

        // Open and send request aynchronously //
        xmlhttp.open(method, url, true);
        xmlhttp.send(data);

        // Return a custom promise object (for backwards compatibility) which allows the setting of finalCallback when response completes //
        return {
            onComplete: function (callback) {
                finalCallback = callback;
                if (complete) finalCallback(response);
            }
        }

    }

    Wyvern.resolveModuleName = function (name) {
        if (name == null) return name;
        return name.indexOf('/') == -1 ? name + '/' + name : name;
    }

    Wyvern.pending = function () { };

    // Define a new module //
    Wyvern.prototype.define = function (/* [dependencies], builder */) {
        // Save some important information which we will look up later //
        var me = this;                          // Current context
        var name = this.moduleName;             // Name of the module
        var continuation = this.continuation;   // Next code to execute when definition complete
        var dependencies = arguments.length > 1 ? arguments[0] : []; // Additional dependencies for this module
        var builder = arguments.length > 1 ? arguments[1] : arguments[0];   // The function to call which constructs a module instance

        if (typeof name !== 'string') throw new Error("Unnamed module attempting to be defined.");

        // Load dependencies for this module, then build it //
        if (typeof me.module[name] == 'undefined') {
            me.module[name] = Wyvern.pending;
            this.loadDependenciesThen(dependencies, function (depArray) {
                // This will eventually pass the dependencies to the builder in order //
                me.module[name] = builder.apply(null, depArray);
                // Make sure we actually got something back //
                if (typeof me.module[name] === 'undefined') throw new Error("Module returned undefined: " + name);
                if (typeof continuation == 'function') continuation();
            });
        }
        else if(me.module[name] === Wyvern.pending){
            var interval = setInterval(function () {
                if (me.module[name] !== Wyvern.pending) {
                    clearInterval(interval);
                    if (typeof continuation == 'function')
                        continuation();
                }
            }, 50);
        }
        else {
            if (typeof continuation == 'function')
                setTimeout(function () { continuation(); });
        }
    }

    Wyvern.prototype.import = function (name, callback) {
        // Resolve the name of the module //
        name = Wyvern.resolveModuleName(name);
        // Make sure we have a valid module name //
        if (typeof name === 'undefined') throw new Error("Cannot load 'undefined' module.");
        var me = this; // Save the wyvern context (this)
        if (typeof (me.module[name]) == 'undefined') {
            // Path to the module file //
            var path = this.path.module + name + '.js';
            var extend = function (obj) {
                return new Wyvern({
                    moduleName: name,
                    modulePath: path.substr(0, path.lastIndexOf('/')),
                    continuation: function () {
                        if (typeof (callback) == 'function')
                            callback(obj.module[name], name);
                    }
                });
            }
            if (typeof Wyvern.prototype.import.cache[path] === 'undefined') {
                // Load the script asynchronously //
                this.ajax(path, "GET").onComplete(function (responseText) {
                    // Once complete, we create a new object which extends the current wyvern object //
                    // But also provides the module name and a continuation for continuting loading //
                    // modules. //
                    var ex = extend(me);
                    
                    // Create a function as a container and execute the module code //
                    // We also pass the wyvern object as first parameter to give context //
                    // to the loading module. //
                    var factory = new Function("wyvern", responseText);
                    Wyvern.prototype.import.cache[path] = factory;
                    factory(ex);
                });
            }
            else {
                // Call the cached controller //
                Wyvern.prototype.import.cache[path](extend(me));
            }
        }
        else {
            // No dependencies means we can import the module immediately and save some time //
            callback(me.module[name], name);
        }
    }
    Wyvern.prototype.import.cache = {};
    Wyvern.prototype.loadDependenciesThen = function (dependencies, callback) {
        // If no dependencies, we just call the callback //
        if (dependencies == null) {
            callback([]);
            return;
        }
        // If we have dependencies, we need to load them first //
        /// This is tricky since we load them asynchronously, but need them in call argument order //
        else {
            var me = this;          // Pin the current context
            var loaded = 0;         // Determine how many dependencies have been loaded.  Once all are loaded, the callback is called.
            var args = [];          // The dependencies instances in argument call format.  Will be passed as individual arguments for callback.
            if (!Array.isArray(dependencies)) dependencies = [dependencies];

            // Resolve all dependency names //
            for (var i = 0; i < dependencies.length; i++) {
                dependencies[i] = Wyvern.resolveModuleName(dependencies[i]);
            }

            // If there are dependencies, we load them //
            if (dependencies.length > 0) {
                for (var i = 0; i < dependencies.length; i++) {
                    // If this dependency argument is actually a function, call it and load its result.  Allows dynamic dependency injection! //
                    var dependency = typeof (dependencies[i]) == "function" ? dependencies[i]() : dependencies[i];
                    // Import the dependency //
                    me.import(dependency, function (dep, name) {
                        // When dependency is finished loading, add one to the loading count //
                        loaded++;
                        // Place the dependency in the proper argument slot to retain call ordering //
                        var index = dependencies.indexOf(name);
                        if (index < 0) throw new Error("Wyvern internal error - One of the dependencies failed to map: " + name);
                        args[index] = dep;
                        // If all dependencies are loaded, call the callback.  We'll send the arguments as a single array this time. //
                        // Some calls need the array itself, while others need it expanded.  If we send the array, a wrapper function can expand it if necessary //
                        if (loaded == dependencies.length) {
                            callback.call(null, args);
                        }
                    });
                }
            }
            // If no dependencies, just call the callback //
            else {
                callback();
            }
        }
    }

    // Run code which depends on wyvern modules //
    Wyvern.run = function (/* [dependencies], callback*/) {
        var wyvern = new Wyvern();
        return wyvern.run.apply(wyvern, arguments);
    }

    // Run code which depends on wyvern modules //
    Wyvern.prototype.run = function (/* [dependencies], callback*/) {
        var dependencies = arguments.length > 1 ? arguments[0] : [];
        var callback = arguments.length > 1 ? arguments[1] : arguments[0];
        this.loadDependenciesThen(dependencies, function (depArray) { /* Runner callback */ callback.apply(null, depArray); });
    }
    // Clone the wyvern object into the target //
    Wyvern.prototype.into = function (target) {
        for (var item in Wyvern.prototype) {
            if (Wyvern.prototype.hasOwnProperty(item))
                target[item] = Wyvern.prototype[item];
        }
        target.__chugable = true;
        return target;
    }

    // Add an event listener to a given source element with the given event and callback //
    Wyvern.prototype.addEventListener = function(source, evnt, callback) {
        if (source != null) {
            source.$wyvern = source.$wyvern || {};
            source.$wyvern.listeners = source.$wyvern.listeners || {};
            source.$wyvern.listeners[evnt] = source.$wyvern.listeners[evnt] || [];
            source.$wyvern.listeners[evnt].push(callback);
            if (typeof source.addEventListener === 'function')
                source.addEventListener(evnt, callback, false);
            else if (typeof source.attachEvent === 'function')
                source.attachEvent("on" + evnt, callback);
            else
                throw new Error("Unable to attach event");
        }
    }

    Wyvern.prototype.removeEventListener = function (source, evnt, callback) {
        if (source.$wyvern && source.$wyvern.listeners && source.$wyvern.listeners[event]) {
            var newListeners = [];
            for (var i = 0; i < source.$wyvern.listeners[event]; i++) {
                if (source.$wyvern.listeners[event][i] !== callback) {
                    newListeners.push(source.$wyvern.listeners[event][i]);
                }
            }
            source.$wyvern.listeners[event] = newListeners;
        }
        if (typeof (source.removeEventListener) === 'function')
            source.removeEventListener(evnt, callback);
        else if (typeof (source.detatchEvent === 'function'))
            source.detatchEvent('on' + evnt, callback);
    }

    Wyvern.prototype.cleanupEventListeners = function (source, recursive) {
        if (source.$wyvern && source.$wyvern.listeners) {
            for (var evnt in source.$wyvern.listeners) {
                if (source.$wyvern.listeners.hasOwnProperty(evnt)) {
                    for (var i = 0; i < source.$wyvern.listeners[evnt].length; i++) {
                        var callback = source.$wyvern.listeners[evnt][i];
                        if (typeof (source.removeEventListener) === 'function')
                            source.removeEventListener(evnt, callback);
                        else if (typeof (source.detatchEvent === 'function'))
                            source.detatchEvent('on' + evnt, callback);
                    }
                    source.$wyvern.listeners[evnt] = [];
                }
            }
        }
        if (recursive) {
            for (var i = 0; i < source.childNodes.length; i++)
                this.cleanupEventListeners(source.childNodes[i], recursive);
        }
    }

    var extract = function (directive, node) {

        // Append a series of argument to the end of each top-level call in a command //
        var appendToCall = function (command, args) {


            // Turn this into a call if it is not //
            if (command.indexOf('(') < 0)
                command = command + "()";

            // Join the arguments into a nice comma separated string first //
            var argsText = args.join(', ');
            var result = '';
            var level = 0;
            var begin = 0;

            // We figure out where the top level commands are by counting parenthesis //
            // Once a top level ')' is found, we inject our args into the call //
            for (var i = 0; i < command.length; i++) {
                if (command[i] == '(') {
                    level++;
                    if (level == 1) begin = i + 1;
                }
                if (command[i] == ')') {
                    if (level == 1) {
                        var x = command.substring(begin, i).trim();
                        result += (command.substring(begin, i).trim().length > 0 ? ', ' : '') + args + ')';
                    }
                    else {
                        result += ')';
                    }
                    level--;
                }
                else {
                    result += command[i];
                }
            }

            return result;
        }

        var cleanCommand = function (command) {
            // Remove comments //
            return command
                .replace(/\/\*.*\*\//g, '')
                .replace(/\/\/.*/g, '');
        }

        if (typeof directive === 'string') {
            var directives = [];
            // Multiple commands supported //
            var commands = directive.split(';');
            // Go through all commands and parse them into directives //
            for (var i = 0; i < commands.length; i++) {
                // Left side of ':' is module info including name and optional evnet //
                var pivot = commands[i].indexOf(':');
                if (pivot >= 0) {
                    // Get directive parts from moduleParts and command parts.  Format: module.event:command(...) //
                    var moduleParts = commands[i].substr(0, pivot).split('.');
                    var moduleName = moduleParts.length > 0 ? moduleParts[0].trim() : null;
                    var eventName = moduleParts.length > 1 ? moduleParts[1].trim() : null;
                    var command = cleanCommand(commands[i].substr(pivot + 1)).trim();
                    var memberName = command.substr(0, command.indexOf('(')).trim();
                    var isCallback = eventName !== 'bind';
                    if (!memberName || memberName.length == 0) memberName = command;
                    // Finally, push the new directive and build callbacks as necessary for executing this directive //
                    directives.push({
                        moduleName: moduleName,
                        eventName: eventName,
                        memberName: memberName,
                        command: command,
                        commandCallback: isCallback ? new Function('module', 'node', 'with (module) { return (' + appendToCall(command, ['node']) + '); }') : null,
                        eventCallback: isCallback ? new Function('module', 'event', 'with (module) { return (' + appendToCall(command, ['event']) + '); }') : null,
                    });
                }
            }
            return directives;
        }
    }

    // Applies event listeners to DOM changes //
    Wyvern.prototype.applyDOMListeners = function (source) {
        var wyvern = new Wyvern({ source: source });
        var apply = function (node) {
            if (typeof node.getAttribute == 'function') {
                
                var applyListener = function (directive, module, node) {
                    wyvern.addEventListener(node, directive.eventName, function (event) { directive.eventCallback(module, event); });
                }

                var directives = extract(node.getAttribute("data-wyvern"));

                if (typeof directives === 'object') {
                    for (var m = 0; m < directives.length; m++) {

                        (function (m) {
                            var directive = directives[m];
                            // Import the module //
                            wyvern.import(directive.moduleName, function (module) {

                                // Add this module to the DOM element //
                                node.$wyvern = node.$wyvern || {
                                    modules: []
                                };
                                node.$wyvern.modules.push(module);

                                if (module !== null && module.listeners !== null) {

                                    if (directive.command !== null) {
                                        if (directive.eventName === 'bind') {
                                            // Do nothing right now //
                                            var fnSet = new Function('node', 'module', "with(module) { " + directive.command + " = node.value; }");
                                            var fnGet = new Function('node', 'module', "with(module) { node.value = " + directive.command + " }");
                                            fnGet(node, module);
                                            wyvern.addEventListener(node, 'change', function () { fnSet(node, module); });
                                        }
                                        else if (directive.eventName === null) {
                                            if (typeof module[directive.memberName] !== 'function')
                                                throw new Error('Module member is not a function: ' + directive.moduleName + '.' + directive.memberName);
                                            directive.commandCallback(module, node);
                                        }
                                        else {
                                            applyListener(directive, module, node);
                                        }
                                    }
                                }
                            });
                        })(m);
                    }
                }
            }
        }
        var recursiveApply = function (node) {
            apply(node);
            for (var i = 0; i < node.childNodes.length; i++) {
                recursiveApply(node.childNodes[i]);
            }
        }

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // Build wyvern modules which were requested by this node //
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    var node = mutation.addedNodes[i];
                    wyvern.applyDOMListeners(node);
                }
                // Notify all modules for this node that it is being released //
                for (var i = 0; i < mutation.removedNodes.length; i++) {
                    var node = mutation.removedNodes[i];
                    wyvern.cleanupEventListeners(node, true);
                    if (typeof node.$wyvern === 'object' && Array.isArray(node.$wyvern.modules)) {
                        for (var m = 0; m < node.$wyvern.modules.length; m++) {
                            var module = node.$wyvern.modules[m];
                            if (typeof module.$release === 'function')
                                module.$release(node);
                        }
                    }
                }
            });
        });

        observer.observe(source, {
            childList: true,
            subtree: true
        });

        recursiveApply(source);
    }

    Wyvern.prototype.on = function (event, nodes, callback) {
        if (nodes == null) return;
        if (typeof nodes.length !== 'number') nodes = [nodes];
        for (var i = 0; i < nodes.length; i++) {
            if (typeof nodes[i].addEventListener === 'function')
                nodes[i].addEventListener(event, callback);
            else if (typeof nodes[i].attachEvent === 'function')
                nodes[i].attachEvent('on' + event, callback);
        }
    }

    Wyvern.prototype.url = function (relativePath) {
        return this.modulePath + ((relativePath && relativePath.length > 0 && relativePath[0] !== '/') ? '/' : '') + relativePath;
    }

    // Utility function to clone an object.  Specify 'deep = true' to attempt a deep copy //
    Wyvern.copy = function (obj, deep) {
        if (obj === null || typeof obj === 'undefined' || typeof obj !== 'object') return obj;

        if (obj instanceof Date) {
            var result = new Date();
            result.setTime(obj.getTime());
            return result;
        }

        if (obj instanceof Array) {
            var result = [];
            for (var i = 0; i < obj.length; i++)
                result[i] = deep ? Wyvern.copy(obj[i]) : obj[i];
            return result;
        }

        if (obj instanceof Object) {
            var result = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) result[attr] = deep ? Wyvern.copy(obj[attr]) : obj[attr];
            }
            return result;
        }

        throw new Error("Copy not supported for this object.");
    }
    Wyvern.prototype.copy = Wyvern.copy;

    // Build the global wyvern object //
    global.wyvern = new Wyvern();

    // Apply DOM change event listening //
    Wyvern.given(window).on('load', function () {
        global.wyvern.run(['katana'], function (katana) {
            Wyvern.template = katana;
            wyvern.applyDOMListeners(document.documentElement);
        });
    });

})(this);