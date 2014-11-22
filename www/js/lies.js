// Constants
const c_init_state = 0;
const c_browse_state = 1;
const c_stalk_state = 2;
const c_login_state = 3;
const c_image_state = 4;
const c_submit_state = 5;

const c_host = 'lies.hazardous.se';
const c_web_site = 'http://' + c_host;
const g_debug = true;

// Initializing globals
var g_fsm = null;

// The onload stuff
document.addEventListener('deviceready', function () {
    console.log("Device ready");

    if (!window.btoa) window.btoa = $.base64.btoa;
    if (!window.atob) window.atob = $.base64.atob;

    document.addEventListener('backbutton', g_fsm.cancel, false); // Fix the back button on Android

    // Start the Finite State Machine
    g_fsm = new FSM();
}, false);

// Customize alert box
if (navigator.notification) {
    window.alert = function (txt) {
        navigator.notification.alert(txt, null, "Warning", "Ok");
    }
}


// This is the Finite State Machine
function FSM() {
    var self = this;
    var current_user = null;
    var event_sel = "click tap";
    var current_state_id = c_init_state;
    var browse = new BrowseState({parent: this, next_state: c_browse_state});
    var current_state = null;
    var spinner = $('#spinner');
    var btn_refresh = $('#btn-refresh');
    var btn_back = $('#btn-back');
    var btn_user = $('#btn-user');
    var btn_add = $('#btn-add');


    // Private functions
    function _restricted_check(i_state) {
        if (current_user) {
            return true;
        }
        switch (i_state) {
            case c_stalk_state:
            case c_image_state:
            case c_submit_state:
                return false;
            default:
                return true;
        }
    }

    // params:
    // state,
    // data (for stalk and login states),
    // resume (for coming back to resume from image)
    this.switchState = function (i_switch) {
        spinner.show();
        if (!_restricted_check(i_switch.state)) {
            return self.switchState({
                state: c_login_state,
                data: i_switch
            });
        }

        current_state_id = i_switch.state;
        if (current_state_id == c_browse_state) {
            btn_refresh.show();
            btn_back.hide();
        } else {
            btn_refresh.hide();
            btn_back.show();
        }

        // TODO: Which is more efficient, creating new a new state object each time we're changing focus?
        // TODO: Or reusing one object of each? A bit worried about memory use vs stale values
        switch (current_state_id) {
            case c_browse_state:
                $.mobile.changePage('#latest-lies', 'slide', true, true);
                current_state = browse;
                break;
            case c_stalk_state:
                $.mobile.changePage('#check-a-liar', 'slide', true, true);
                current_state = new StalkState({parent: self, stalk_uid: i_switch.data});
                break;
            case c_login_state:
                $.mobile.changePage('#identity-lies', 'slide', true, true);
                current_state = new LoginState({parent: self, data: i_switch.data});
                break;
            case c_image_state:
                current_state = new ImageState({parent: self, sibling: current_state});
                break;
            case c_submit_state:
                $.mobile.changePage('#tell-a-lie', 'slide', true, true);
                current_state = i_switch.resume ? i_switch.resume : new LieState({parent: self});
                break;
            default:
                throw ( new Error("Unknown state:" + current_state_id) );
        }
        current_state.update();
    };

    this.setUser = function (user) {
        if (user) {
            current_user = user;
            if (window.localStorage) {
                window.localStorage.setItem('user', current_user.getJSON());
            }
        } else {
            current_user = null;
            if (window.localStorage) {
                window.localStorage.removeItem('user');
            }
        }
    };

    this.user = function () {
        return current_user;
    };

    this.cancel = function () {
        current_state.cancel();
    };

    // Init FSM
    // Bind focus and blur to all input fields
    $('input').each(function () {
        this.on('focus', _focus_input);
        this.on('blur', _blur_input);
    });

    function _focus_input(elm) {
        if ($(elm).attr('def_label') == $(elm).val()) {
            $(elm).val('');
        }
    }

    function _blur_input(elm) {
        if ($(elm).val() == '') {
            $(elm).val($(elm).attr('def_label'));
        }
    }

    // Bind the toolbar buttons here - instead of in index.html
    btn_add.on(event_sel, function () {
        self.switchState({next: c_submit_state});
    });
    btn_user.on(event_sel, function () {
        self.switchState({next: c_login_state});
    });
    btn_back.on(event_sel, function () {
        current_state.cancel();
    });
    btn_refresh.on(event_sel, function () {
        current_state.update();
    });

    if (window.localStorage) {
        var user_hal_loaded = JSON.parse(window.localStorage.getItem("user"));
        if (user_hal_loaded != null) {
            current_user = new User(user_hal_loaded);
        }
    }

    // Let's get the show on the road
    self.switchState({state: c_browse_state});
}


