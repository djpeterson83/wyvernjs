# WyvernJS
WyvernJS is a "When You Need It" module pattern.  Decorate your HTML elements with Wyvern modules to instantaneously provide specific and custom logic to those elements.  It's **easy** and **gets out of your way**!

# How To Use WyvernJS
Wyvern lives by a simple concept: be available when you need it.  Additionally, Wyvern tries to stay out of the way when you don't need it.  To accomplish this task, Wyvern likes to attach itself to HTML nodes that you specify.  It will then spin up a Wyvern module on that element and begin executing code.  You control what module and what function is called through the use of the `data-wyvern` attribute.  As an example, lets create a **Hello World** module.

# Hello World
After you install Wyvern, you will have a wyvern folder in your web site's public directory.  From here, Wyvern stores its modules in the aptly named `modules` folder.  To begin creating your first module, create a new folder in the `modules` folder and name it `hello`.  Next, create a `hello.js` inside your newly created `hello` folder.  Put this in `hello.js`:

## hello.js ##

    wyvern.define(function() {
      return {
        speak: function(node) {
          node.innerText = 'Hello World!';
        }
      };
    });

That's it!  You've just created your first module.  Now your module won't do anything until you attach it to something.  Let's load up Wyvern on an HTML page and attach our module to an element.  Create an `index.html` in your public folder.  Then put this code in it:

## index.html ##

    <!DOCTYPE html>
    <html>
      <head>
        <title>My First Wyvern Project</title>
        <script src="js/wyvern.js"></script>
      </head>
      <body>
        <h1>Welcome to Wyvern</h1>
        <div>
          Wyvern would like to say: <span data-wyvern="hello:speak" ></span>
        </div>
      </body>
    </html>
    
Simple!  Wyvern will take care of the rest.

# And Beyond
Even though Wyvern works really well when attached to HTML elements, you can use Wyvern as a base for other frameworks.  In fact, it was designed for this!  Wyvern works like a traditional AMD system.  In fact, you can specify the names of other Wyvern libraries in an array when defining your Wyvern module:

    wyvern.define(['view'], function(view) {
      return {
        display: function(node) {
          // Use the 'view' module to display templated content //
          view('my-view', node);
        }
      };
    });
    
Wyvern will wire up dependencies for you, making your life a lot easier!  Lets assume that you are using Wyvern for a much larger code base.  You can also load and call Wyvern modules independently of the HTML DOM:

    wyvern.run(['dependency1', 'dependency2'], function(a, b) {
      // Do something interesting here.  Notice we are not attached to a DOM node! //
      a.foo(b);
    });
    
You'll find Wyvern has a few tricks up its sleave.  Other features include modules for templating and HTTP request calls.  More on these in the future...
