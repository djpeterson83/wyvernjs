wyvern.define(function () {
    return {
        addClass: function (className, node) {
            if (className == null || node == null) return;
            className = Array.isArray(className) ? className : [className];
            if (typeof node.className === 'string') {
                var classes = node.className.split(' ');
                for (var i = 0; i < className.length; i++) {
                    if (classes.indexOf(className[i]) == -1) {
                        classes.push(className[i]);
                        node.className = classes.join(' ');
                    }
                }
            }
        },
        removeClass: function (className, node) {
            if (className == null || node == null) return;
            className = Array.isArray(className) ? className : [className];
            var classes = node.className.split(' ');
            var newClasses = [];
            if (classes.indexOf(className) == -1) {
                for (var i = 0; i < classes.length; i++) {
                    if (className.indexOf(classes[i]) < 0)
                        newClasses.push(classes[i]);
                }
                node.className = newClasses.join(' ');
            }
        }
    };
});