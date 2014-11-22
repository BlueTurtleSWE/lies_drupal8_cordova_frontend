// Fix for buttons getting stuck in a pressed state
// See more at: http://jsfiddle.net/5t48g/
$(document).bind('mobileinit', function () {
    $(document).on('tap click', function () {
        var self = this;
        setTimeout(function () {
            self.removeClass($.mobile.activeBtnClass);
        }, 500);
    });
});