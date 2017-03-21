// Simply define our module here //
// Notice that we include the 'view' module as we'll be using it to display content //
wyvern.define(['view'], function (view) {

    // Here's our data model.  It's just some stuff to display in a Katana view //
    var model = {
        title: "My Demo View",
        content: "This view was constructed using Katana via Wyvern.  You can explore this view's code by going to " + wyvern.url('demo-module.js'),
        items: [
            'First Item',
            'Second Item',
            'Third Item'
        ]
    };

    // This object is our actual module.  We can add function  //
    // (such as 'display') which can be called to do actions //
    return {
        display: function (node) {
            // 'display' simply displays our view after binding it to the model //
            view('demo-view', node, model);
        }
    };

});