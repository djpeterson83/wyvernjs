wyvern.define(['wire', 'html'], function (wire, html) {
    return {
        check: function (node) {
            wire.get(node.href)
                .fail(function (data) {
                    html.addClass(['bad-link'], node);
                    wyvern.on('click', node, function (event) {
                        event.preventDefault();
                        alert('Sorry, this link appears to be broken.');
                    });
                });
        }
    }
});