/**
 * A user class for use with a REST based frontend for Drupal 8
 */


const user_hal_tpl = {
    "_links": {"type": {"href": "http:\/\/lies.hazardous.se\/rest\/type\/user\/user"}},
    "name": [{"value": null}],
    "mail": [{"value": null}],
    "pass": [{"value": null}],
    "status": [{"value": 1}]
};


// User is a value object, it will either GET, POST or PATCH on initialization
// and it can't be changed after initialization has finished
function User(i_user) {
    if (typeof(i_user) != "object") {
        throw(new Error("Invalid parameter when initializing User\n"+dump(i_user)));
    }
    // i_user is an object with one of the following setups
    // 1) A full hal object (no callback possible, instantly ready)
    // 2) name, mail, pass, edit (defaults to false), method (defaults to POST), cb (optional)
    // 3) uid, cb (optional)

    // Private vars
    var _user_hal = null;
    var _ready = false;

    // Private consts
    const _user_uri = c_web_site + '/entity/user/';

    // Private functions
    var _always_cb = i_user.cb ? i_user.cb : function () {
    };

    var _admin_before_func = function (xhr) {
        xhr.setRequestHeader("Authorization", g_admin_login_base64);
    }

    var _get_name = function () {
        var ret_val = _user_hal.name[0].value;
        if (g_debug) console.log("Name: "+ret_val);
        return ret_val;
    }

    var _get_pass = function () {
        var ret_val = _user_hal.pass[0].value;
        if (g_debug) console.log("Pass: "+ret_val);
        return ret_val;
    }

    var _user_auth = function (xhr) {
        var ret_val = 'Basic ' + btoa(_get_name() + ':' + _get_pass());
        if (g_debug) console.log('Auth: '+ret_val);
        return ret_val;
    }

    var _success_get = function (response) {
        if (g_debug) {
            console.log(dump(response));
        }
        if (typeof(response) == 'object' && response._links) {
            _user_hal = response;
            _ready = true;
        } else {
            alert("Error loading user from webb");
            throw (new Error("There's no such user... Now, who lied!?"));
        }
        _always_cb();
    }

    var _success = function (msg) {
        if (g_debug) {
            console.log(dump(msg));
        }
        _ready = true;
        _always_cb();
    }

    var _fail = function (xhr, err, exception) {
        if (g_debug) {
            console.log(err);
            console.log(dump(exception));
        }
        if (err.match(/parsererror/)) {
            return _success("Continue anyway");
        }
        _always_cb(err);
    }

    // Public functions
    this.getName = _get_name;
    this.getAuth = _user_auth;

    this.getMail = function () {
        return _user_hal.mail[0].value;
    }

    this.getJSON = function () {
        return JSON.stringify(_user_hal);
    }

    this.render = function () {
        var ret_val = '<div class="item-lie"><div class="item-title">The Liar is: ' + _get_name() + "</div></div>";
        return ret_val;
    }

    this.isReady = function () {
        return _ready;
    }

    // Initialization
    // TODO: Break these out into separate funcs?
    if (i_user._links) {
        // We got all of the object data, probably loaded from a settings key store
        _user_hal = i_user;
        _ready = true;
    } else if (i_user.edit && i_user.name && i_user.pass && i_user.mail) {
        // Create new or edit existing object (eg change password)
        _user_hal = user_hal_tpl;
        _user_hal.name[0].value = i_user.name;
        _user_hal.mail[0].value = i_user.mail;
        _user_hal.pass[0].value = i_user.pass;

        // Make an ajax call to save the object
        $.ajax({
            beforeSend: _admin_before_func,
            accepts: 'application/hal+json',
            contentType: 'application/hal+json',
            type: i_user.method ? i_user.method : 'POST',
            data: JSON.stringify(_user_hal),
            url: _user_uri
        }).done(_success).fail(_fail);
    } else if (i_user.uid) {
        // Make an ajax call to load the object from the server
        var auth = g_curr_user?g_curr_user.getAuth():getAuth();
        var load_uri = c_web_site + '/user/' + i_user.uid;
        console.log(dump(i_user));
        console.log("Load:"+load_uri);
        $.ajax({
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", auth);
            },
            headers: {
                Accept: 'application/hal+json'
            },
            type: 'GET',
            url: load_uri
        }).done(_success_get).fail(_fail);
    } else if (i_user.name && i_user.pass) {
        // TODO: Come up with a way to get a more complete version of _this_ users data from server as a response
        // A simple login
        _user_hal = user_hal_tpl;
        _user_hal.name[0].value = i_user.name;
        _user_hal.pass[0].value = i_user.pass;
        var auth = 'Basic ' + btoa(_get_name() + ':' + _get_pass());
        console.log('Manually calced auth: '+auth);

        // Make an ajax call to check the supplied credentials
        var test_dest = c_web_site + '/user/1';
        console.log('Test dest:'+test_dest);
        $.ajax({
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", _user_auth());
            },
            headers: {
                Accept : 'application/hal+json'
            },
            type: 'GET',
//            url: 'http://lies.hazardous.se/user/1'
            url: c_web_site + '/user/1'
        }).done(_success)
            .fail(_fail);
    } else {
        throw(new Error("Invalid members of user object"));
    }

    return this;
}