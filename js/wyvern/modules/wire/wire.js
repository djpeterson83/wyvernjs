(function (global) {

    "use strict";

    var dependencies = [
    ];

    var module = function () {

        var wire = {};
        var ajax = {};
        wire.baseUrl = '';

        var Config = function (settings) {
            if (typeof settings === 'object' || typeof settings === 'function') {
                for (var attr in settings) {
                    if (settings.hasOwnProperty(attr))
                        this[attr] = settings[attr];
                }
            }
            this.mime = typeof this.mime !== 'undefined' ? this.mime : null;
            this.async = typeof this.async !== 'undefined' ? this.async : true;
        }

        // Configure for various request formats (note: response formats are determined by response package) //
        Config.prototype.json = function () { this.mime = 'application/json'; return this; }
        Config.prototype.html = function () { this.mime = 'text/html'; return this; }
        Config.prototype.plain = function () { this.mime = 'text/plain'; return this; }
        Config.prototype.xml = function () { this.mime = "application/xml"; return this; }

        wire.config = function (settings) { return new Config(settings); }
        
        var toJSON = function (data) {
            return JSON.stringify();
        }

        var toQueryString = function (data, sep) {
            var sep = typeof sep ==='undefined' ? '' : sep;
            var result = '';
            if (typeof data === 'function' || typeof data === 'object') {
                for (var attr in data) {
                    if (data.hasOwnProperty(attr)) {
                        result += sep + encodeURIComponent(attr) + "=" + encodeURIComponent(data[attr]);
                        sep = '&';
                    }
                }
            }
            return result;
        }

        ajax.call = function (method, url, data, config) {
            method = method ? method.toUpperCase() : method;
            if (typeof data === 'function') data = data();
            config = new Config(config);
            if ((config.mime === 'application/xml' || config.mime === 'text/xml') && typeof data === 'object') throw new Error("Wire does not currnetly support serializing objects to XML.");
            if (config.mime === 'text/html' && typeof data === 'object') throw new Error("Wire does not currnetly support serializing objects to HTML.");

            var baseUrl = config.baseUrl || wire.baseUrl;
            var xhr = new XMLHttpRequest();
            if (method == 'GET' || method == 'HEAD')
                xhr.open(method, wire.baseUrl + url + toQueryString(data, url.indexOf('?') >= 0 ? '&' : '?'), config.async, config.user, config.password);
            else
                xhr.open(method, wire.baseUrl + url, config.async, config.user, config.password);

            if (method != 'GET' && method != 'HEAD') {
                var dataFormatted = data;
                if (config.mime === 'application/json') dataFormatted = toJSON(data);
                if (config.mime === null) dataFormatted = toQueryString(data);
                xhr.setRequestHeader('Content-type', config.mime);
                setTimeout(function () { xhr.send(dataFormatted); })
            }
            else {
                setTimeout(function () { xhr.send(); })
            }

            return new State(xhr, url);
        }

        ajax.response = {};
        ajax.response.convert = function (response) {
            return { error: false, result: response };
        }

        wire.head = function (url, data, config) {
            return ajax.call("HEAD", url, data, config);
        }

        wire.get = function (url, data, config) {
            return ajax.call("GET", url, data, config);
        }

        wire.put = function (url, data, config) {
            return ajax.call("PUT", url, data, config);
        }

        wire.post = function (url, data, config) {
            return ajax.call("POST", url, data, config);
        }

        wire.delete = function (url, data, config) {
            return ajax.call("DELETE", url, data, config);
        }

        wire.trace = function (url, data, config) {
            return ajax.call("TRACE", url, data, config);
        }

        wire.patch = function (url, data, config) {
            return ajax.call("PATCH", url, data, config);
        }

        wire.options = function (url, data, config) {
            return ajax.call("OPTIONS", url, data, config);
        }

        wire.connect = function (url, data, config) {
            return ajax.call("CONNECT", url, data, config);
        }

        var State = function (xhr, url) {
            var state = this;
            var responders = {};

            var internal = {};
            internal.responders = {};
            internal.responders.then = [];
            internal.responders.fail = [];
            internal.responders.error = [];
            internal.respond = function () {
                var contentType = this.getResponseHeader('content-type');
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status >= 200 && xhr.status <= 299)
                        internal.resolve(internal.responders.then, xhr.responseText, contentType);
                    if (xhr.status === 0 || (xhr.status >= 400 && xhr.status <= 599))
                        internal.resolve(internal.responders.fail, xhr.responseText, contentType);
                }
            }
            internal.resolve = function (callbacks, text, contentType) {
                var pack = (xhr.responseText !== null && xhr.responseText !== '')
                    ? ajax.response.convert( contentType === 'application/json' ? JSON.parse(text) : text)
                    : ajax.response.convert(null);
                for (var i = 0; i < callbacks.length; i++)
                    callbacks[i](pack.result, {xhr: xhr, status: xhr.status, textResponse: xhr.textResponse});
                callbacks.length = 0;
            }

            this.then = function (callback) {
                if (typeof callback !== 'function') { throw 'Type of callback is not a function: ' + typeof (callback); }
                internal.responders.then.push(callback);
                if (xhr.readyState === XMLHttpRequest.DONE)
                    internal.respond();
                return state;
            }

            this.updates = function (callback) {
                return state.then(callback);
            }

            this.fail = function (callback) {
                if (typeof callback !== 'function') { throw 'Type of callback is not a function: ' + typeof (callback); }
                internal.responders.fail.push(callback);
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    internal.respond();
                }
                return state;
            }

            xhr.onreadystatechange = internal.respond;

        }

        return wire;
    }

    if (typeof define === 'function' && define.amd)
        define(dependencies, module);
    else
        global.wire = module;
    
    if (wyvern && typeof wyvern.define === 'function')
        wyvern.define(module);

})(this);