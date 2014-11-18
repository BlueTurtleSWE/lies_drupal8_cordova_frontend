/**
 * A node class for use with a REST based frontend for Drupal 8
 */


function hal_type(hal_obj) {
    if (!hal_obj._links) {
        throw (new Error ("Object is not a hal object: "+dump(hal_obj)));
    }
    if (!hal_obj._links.type) {
        throw (new Error ("HAL object invalid. Has no type declaration: "+dump(hal_obj)));
    }
    if (hal_obj._links.type.href == "http:\/\/lies.hazardous.se\/rest\/type\/node\/a_lie") {
        return 'Node';
    }
    if (hal_obj._links.type.href == "http:\/\/lies.hazardous.se\/rest\/type\/file\/file") {
        return 'File';
    }
    if (hal_obj._links.type.href == "http:\/\/lies.hazardous.se\/rest\/type\/user\/user") {
        return 'User';
    }
    return 'Unknown';
}


const node_hal_tpl = {
    "_links": {
        "type": {"href": "http:\/\/lies.hazardous.se\/rest\/type\/node\/a_lie"},
        "http:\/\/lies.hazardous.se\/rest\/relation\/node\/a_lie\/field_the_proof": [{"href": null}]
    },
    "type": [{"target_id": "a_lie"}],
    "title": [{"value": null}],
    "_embedded": {
        "http:\/\/lies.hazardous.se\/rest\/relation\/node\/a_lie\/field_the_proof": [
            {
                "_links": {
                    "self": {"href": null},
                    "type": {"href": "http:\/\/lies.hazardous.se\/rest\/type\/file\/file"}
                },
                "uuid": [{"value": null}],
                "uri": [{"value": null}]
            }
        ]
    },
    "status": [{"value": "1"}],
    "promote": [{"value": "1"}],
    "sticky": [{"value": "0"}]
};


function Node(i_node) {
    if (typeof(i_node) != "object") {
        throw(new Error("Invalid parameter when initializing Node\n" + dump(i_node)));
    }
    // i_node is an object with one of the following setups
    // 1) A full hal object (no callback possible, instantly ready)
    // 2) title, img_uri (defaults to null), img_uuid (defaults to null), cb (optional)
    // 3) nid, cb (optional)

    // Private vars
    var _node_hal = null;
    var _ready = false;

    // Private consts
    const _submit_node_uri = c_web_site + '/entity/node/';
    const _get_node_uri = c_web_site + '/node/';
    const _img_field = "http:\/\/lies.hazardous.se\/rest\/relation\/node\/a_lie\/field_the_proof";
    const _user_field = "http:\/\/lies.hazardous.se\/rest\/relation\/node\/a_lie\/uid";

    // Private functions
    var _always_cb = i_node.cb ? i_node.cb : function () {
    };

    var _get_title = function () {
        var ret_val = _node_hal.title[0].value;
        if (g_debug) console.log("Title: " + ret_val);
        return ret_val;
    }

    var _get_image = function () {
        var ret_val = _node_hal._links[_img_field]?_node_hal._links[_img_field][0].href:null;
        if (g_debug) console.log("Image: " + ret_val);
        return ret_val;
    }

    var _get_user = function () {
        var user_link = _node_hal._links[_user_field][0].href;
        var match = user_link.match(/\d+$/);
        var ret_val = parseInt(match[0]);
        if (g_debug) console.log("User id: "+ret_val);
        return ret_val;
    }

    var _get_created = function () {
        var ret_val = _node_hal.created?_node_hal.created[0].value:0;
        if (g_debug) console.log("Created: "+ret_val);
        return ret_val;
    }

    var _success_get = function (response) {
        if (g_debug) {
            console.log(dump(response));
        }
        if (typeof(response) == 'object' && response._links) {
            _node_hal = response;
            _ready = true;
        } else {
            alert("Error loading story from webb");
            throw (new Error("There's no such story... Now, who lied!?"));
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
    this.getTitle = _get_title;
    this.getImage = _get_image;
    this.getUser = _get_user;

    this.getJSON = function () {
        return JSON.stringify(_node_hal);
    }

    this.render = function () {
        var ret_val = '<div id="' + _get_created() + '" class="item-lie">'
            + '<div class="item-title">' + _get_title() + '</div>'
            + (_get_image() ? ('<img class="item-proof" src="' + _get_image() + '"/>') : '')
            + '<a href="#" onClick="focus_stalk(' + _get_user() + ');">'
            +'<div class="item-liar">Who lied?</div></a>'
            + '</div>';
        return ret_val;
    }

    this.isReady = function () {
        return _ready;
    }

    // Initialization
    // TODO: Break these out into separate funcs?
    if (i_node._links) {
        // We got all of the object data, probably loaded from a settings key store
        _node_hal = i_node;
        _ready = true;
    } else if (i_node.nid) {
        // Make an ajax call to load the object from the server
        var load_uri = _get_node_uri + i_node.nid;
        console.log(dump(i_node));
        console.log("Load:"+load_uri);
        $.ajax({
            headers: {
                Accept: 'application/hal+json'
            },
            type: 'GET',
            url: load_uri
        }).done(_success_get).fail(_fail);
    } else if (i_node.title) {
        // Create new or edit existing object (eg change password)
        _node_hal = node_hal_tpl;
        _node_hal.title[0].value = i_node.title;
        if (i_node.img_uri && i_node.img_uuid) {
            _node_hal._links[_img_field][0].href = i_node.img_uri;
//            _node_hal._embedded[_img_field][0]._links.self.href = i_node.img_uri;
            _node_hal._embedded[_img_field][0].uri = i_node.img_uri;
            _node_hal._embedded[_img_field][0].uuid = i_node.img_uuid;
        }
        // Make an ajax call to save the object
        $.ajax({
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", g_curr_user.getAuth());
            },
            headers: {
                Accept: "application/hal+json",
                'Content-Type': "application/hal+json"
            },
            type: 'POST',
            data: JSON.stringify(_node_hal),
            url: _submit_node_uri
        }).done(_success).fail(_fail);
    } else {
        throw ( new Error ( "Invalid members of node initializing object" ) );
    }

    return this;
}
