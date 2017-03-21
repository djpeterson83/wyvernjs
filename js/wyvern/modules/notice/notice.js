wyvern.define(function () {
    var map = {};

    var handle = setInterval(function () {
        for (var name in map) {
            if (map.hasOwnProperty(name)) {
                var entry = map[name];
                entry.opacity += 0.01 * entry.direction;
                entry.opacity = Math.min(Math.max(entry.opacity, 0), 1);
                if (entry.duration >= 0) {
                    entry.seconds += 0.01;
                    if (entry.seconds >= entry.duration) {
                        entry.seconds = 0;
                        entry.duration = -1;
                        entry.direction = -1;
                    }
                }

                for (var i = 0; i < entry.nodes.length; i++) {
                    entry.nodes[i].style.opacity = entry.opacity;
                    entry.nodes[i].innerText = entry.text;
                    entry.nodes[i].style.display = entry.opacity <= 0 ? 'none' : 'block';
                    removeNoticeClasses(entry.nodes[i], entry.className);
                    addClass(entry.nodes[i], entry.className);
                }
            }
        }
    }, 10);

    var Notice = function () { };

    var hasClass = function (node, className) {
        return node && typeof node.className === 'string' && node.className.indexOf(className) >= 0;
    }

    var removeNoticeClasses = function (node, exclude) {
        if (node) {
            if(exclude !== 'notice-error') removeClass(node, 'notice-error');
            if (exclude !== 'notice-warning') removeClass(node, 'notice-warning');
            if (exclude !== 'notice-info') removeClass(node, 'notice-info');
            if (exclude !== 'notice-success') removeClass(node, 'notice-success');
        }
    }

    var removeClass = function(node, className) {
        if (node && node.className.indexOf(className) >= 0) {
            node.className = node.className.replace(className, '');
        }
    }

    var addClass = function (node, className) {
        if (node && node.className.indexOf(className) < 0) {
            node.className = node.className.trim() + (node.className && node.className.length ? ' ' + className : className);
        }
    }

    var setNoticeClass = function (name, className) {
        if (map[name])
            map[name].className = className;
    }

    Notice.prototype = {
        constructor: Notice,
        init: function (name, node) {
            map[name] = map[name] || {
                text: '',
                opacity: 0,
                direction: 0,
                duration: -1,
                seconds: 0,
                className: 'notice-info',
                nodes: []
            };
            if (node) {
                map[name].nodes.push(node);
            }
        },
        text: function (name, node) {
            node.innerText = map[name] ? map[name].text : null;
        },
        show: function (name, text, node) {
            if (map[name]) {
                map[name].text = text;
                map[name].direction = 1;
            }
        },
        showError: function (name, text, node) {
            setNoticeClass(name, 'notice-error');
            this.show(name, text, node);
        },
        showWarning: function (name, text, node) {
            setNoticeClass(name, 'notice-warning');
            this.show(name, text, node);
        },
        showInfo: function (name, text, node) {
            setNoticeClass(name, 'notice-info');
            this.show(name, text, node);
        },
        showSuccess: function (name, text, node) {
            setNoticeClass(name, 'notice-success');
            this.show(name, text, node);
        },
        duration: function (name, seconds, node) {
            if (map[name]) {
                if (seconds >= 0) {
                    map[name].duration = seconds;
                    map[name].seconds = 0;
                }
                else
                    map[name].duration = -1;
            }
        },
        hide: function (name) {
            var notice = map[name];
            if (notice) {
                notice.direction = -1;
            }
        },
        $release: function (node) {
            // Remove this node from all notices //
            for (var name in map) {
                if (map.hasOwnProperty(name)) {
                    var entry = map[name];
                    var newNodes = [];
                    for (var i = 0; i < entry.nodes.length; i++) {
                        if (entry.nodes[i] !== node)
                            newNodes.push(entry.nodes[i]);
                    }
                    entry.nodes = newNodes;
                }
            }
         
        }
    };

    return new Notice();
});