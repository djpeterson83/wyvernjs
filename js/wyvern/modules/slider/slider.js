wyvern.define(function () {
    var SliderInstance = function (callback) {
        var me = this;
        this.direction = -1;
        this.speed = 0.05;
        this.value = 0;
        this.lastValue = 0;
        this.interval = setInterval(function () {
            me.lastValue = me.value;
            me.value += me.speed * me.direction;
            if (me.value < 0) me.value = 0;
            if (me.value > 1) me.value = 1;
            if (me.value > 0 && me.value < 1) {
                if (typeof me.callback == 'function')
                    me.callback(me.value);
            }
            else if (me.continuous) {
                if (typeof me.callback == 'function')
                    me.callback(me.value);
            }
            if (me.lastValue !== 0 && me.value === 0) {
                if (typeof me.callback == 'function')
                    me.callback(me.value);
                if (typeof me.onBeginning === 'function')
                    me.onBeginning(me.value);
            }
            if (me.lastValue !== 1 && me.value === 1) {
                if (typeof me.callback == 'function')
                    me.callback(me.value);
                if (typeof me.onEnding === 'function')
                    me.onEnding(me.value);
            }
        }, 10);
        this.callback = callback;
        this.onBeginning = null;
        this.onEnding = null;
        this.continuous = false;
    };

    SliderInstance.prototype.toggle = function () {
        this.direction = -this.direction;
    }
    SliderInstance.prototype.expand = function () {
        this.direction = 1;
    }
    SliderInstance.prototype.contract = function () {
        this.direction = -1;
    }

    return {
        create: function (callback) { return new SliderInstance(callback); },
        filter: {
            sin: function (value) { return Math.sin(value * 3.14159 * 0.5); }
        }
    }

    //return new Slider();
});