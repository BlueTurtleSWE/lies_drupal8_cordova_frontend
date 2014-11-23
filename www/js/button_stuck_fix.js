// Fix for buttons getting stuck in a pressed state
// See more at: http://jsfiddle.net/5t48g/
$(document).bind('mobileinit', function () {
    $(document).on('tap click', function (elm) {
        setTimeout(function () {
            $(elm).removeClass($.mobile.activeBtnClass);
        }, 500);
    });
});