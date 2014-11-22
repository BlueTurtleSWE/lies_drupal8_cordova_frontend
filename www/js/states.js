/**
 * State classes for use with a Cordova based app
 */


function State(i_state) {
    if (typeof(i_state) != "object") {
        throw(new Error("Invalid parameter when initializing State (basic)\n" + dump(i_state)));
    }
    // i_state is an object with at least the following parameters
    // next_state, is the which this state should transition to when closed (-1 means to save state)
    // parent, is the FSM which arbitrates between states

    // Privates
    var self = this;
    var parent = i_state.parent;


    // Public funcs
    this.parent = function () {
        return parent;
    };

    this.update = function () {
        console.log("Override function update() in class!");
    };

    this.done = function () {
        console.log("Override function done() in class!");
    };

    this.cancel = function () {
        console.log("Override function cancel() in class!");
    };
}


// There can only be one! This state is never killed (as long as the app is running)
// Thus, it has no next state - but is simply sleeping when other states are active
function BrowseState(i_state) {
    if (typeof(i_state) != "object") {
        throw(new Error("Invalid parameter when initializing BrowseState\n" + dump(i_state)));
    }

    State.apply(this, arguments);

    // Private vars and consts
    var self = this;
    const list_uri = c_web_site + '/latest-lies';
    var list_elm = $('#list-of-lies');
    var spinner = $('#spinner');

    // Private funcs
    function _success(response) {
        list_elm.empty();
        for (var i = 0; i < response.length; ++i) {
            var node = new Node(response[i]);
            list_elm.append(node.render());
        }
        spinner.hide();
    }

    function _fail(xhr, err, exception) {
        list_elm.empty();
        list_elm.append('<div id="000" class="item-lie">'
        + '<div class="item-title">Somthing broke</div>'
        + '<div class="item-liar">Blame Master Liar</div>'
        + '</div>');
        console.log(err);
        spinner.hide();
    }

    // Public funcs
    this.update = function () {
        console.log("Browse update");
        spinner.show();
        $.ajax({
            headers: {
                Accept: "application/hal+json"
            },
            type: 'GET',
            url: list_uri
        }).done(_success).fail(_fail);
    };

    this.done = function () {
        console.log("Browse done");
        self.parent().switchState({state: c_browse_state});
    };

    this.cancel = function () {
        console.log("Browse cancel");
        self.parent().switchState({state: c_browse_state});
    };

    self.update();
}

// Display all about the individual you want to stalk
function StalkState(i_state) {
    if (typeof(i_state) != "object") {
        throw(new Error("Invalid parameter when initializing StalkState\n" + dump(i_state)));
    }
    if (!i_state.stalk_uid) {
        throw(new Error("Invalid parameters, missing stalk_uid: " + dump(i_state)));
    }

    State.apply(this, arguments);

    // Private vars and consts
    var self = this;
    var stalk_user = new User({uid: i_state.stalk_uid, cb: _user_cb}); // Load user to stalk
    var list_elm = $('#list-of-liars-lies');
    var spinner = $('#spinner');

    // Private funcs
    function _user_cb(msg) {
        if (stalk_user.isReady()) {
            list_elm.append(stalk_user.render());
        } else {
            list_elm.append('<p>Error!!!!</p><p>'+msg+'</p>');
        }
        spinner.hide();
    }

    function _cleanup() {
        list_elm.empty();
    }

    // Public funcs
    this.update = function () {
        // TODO: Implement loading of lies here?
        console.log("Stalk update");
    };

    this.done = function () {
        console.log("Stalk done");
        self.parent().switchState({state: c_browse_state});
        _cleanup();
    };

    this.cancel = function () {
        console.log("Stalk cancel");
        self.parent().switchState({state: c_browse_state});
        _cleanup();
    }
}

// Take care of logging in/out or editing preferences
function LoginState(i_state) {
    if (typeof(i_state) != "object") {
        throw(new Error("Invalid parameter when initializing LoginState\n" + dump(i_state)));
    }

    State.apply(this, arguments);

    //Private vars and consts
    var self = this;
    var current_user = this.parent().user();
    var next_state_data = i_state.data; // i_state data for state that was pre-empted
    var event_sel = "click tap";
    var spinner = $('#spinner');
    var input_alias = $('#register-alias');
    var input_email = $('#register-email');
    var input_pass = $('#register-password');
    var btn_edit = $('#btn-edit-user');
    var btn_create = $('#btn-create-user');
    var btn_login = $('#btn-login');
    var btn_logout = $('#btn-logout');

    // Private funcs
    function _cleanup() {
        // Reset all input fields
        $('#identity-lies input').each(function () {
            this.val(this.attr('def_label'));
            this.off(event_sel);
            this.off('focus');
            this.off('blur');
        });
        // Show all buttons, and turn off their actions
        $('#identity-lies a').each(function () {
            this.show();
            this.off(event_sel);
        })
    }

    function _verify_input(mail) {
        if (input_alias.val() == input_alias.attr('def_label')) {
            alert('Enter a name. Any name.');
            return false;
        }
        if (input_pass.val() == input_pass.attr('def_label')) {
            alert('Pick a password.');
            return false;
        }
        if (mail === true && input_email.val() == input_email.attr('def_label')) {
            alert('Input a valid email');
            return false;
        }
        return true;
    }


    // Public funcs
    this.update = function () {
        console.log("Login update (shouldn't be called?)");
    };

    this.done = function (msg) {
        console.log("Login done");
        if (current_user) { // Login or create
            if (current_user.isReady()) {
                self.parent().setUser(current_user);
            } else {
                if (msg) alert(msg);
                console.log("Login failed");
                return;
            }
        } else { // Logout
            self.parent().setUser(null);
            self.parent().switchState({state: c_browse_state});
            _cleanup();
            return;
        }
        self.parent().switchState(next_state_data ? next_state_data : {state: c_browse_state});
        _cleanup();
    };

    this.cancel = function () {
        self.parent().switchState({state: c_browse_state});
    };


    // Initialize state
    if (current_user) {
        input_alias.val(current_user.getName());
        var mail = current_user.getMail() ? current_user.getMail() : input_email.attr('def_label');
        input_email.val(mail);

        // Activate buttons
        btn_edit.on(event_sel, function () {
            alert('Edit settings not implemented')
        });
        btn_logout.on(event_sel, function () {
            current_user = null;
            self.done();
        });
        // Hide inactive
        btn_login.hide();
        btn_create.hide();
    } else {
        // Activate buttons
        btn_login.on(event_sel, function () {
            if (!_verify_input()) return;
            current_user = new User({name: input_alias.val(), pass: input_pass.val(), cb: self.done});
        });
        btn_create.show(event_sel, function () {
            if (!_verify_input(true)) return;
            current_user = new User({
                name: input_alias.val(),
                pass: input_pass.val(),
                mail: input_email.val(),
                edit: true,
                cb: self.done
            })
        });
        // Hide inactive
        btn_edit.hide();
        btn_logout.hide();
    }
    spinner.hide();
}

// Take care of snapping and uploading images
function ImageState(i_state) {
    if (typeof(i_state) != "object") {
        throw(new Error("Invalid parameter when initializing ImageState\n" + dump(i_state)));
    }

    State.apply(this, arguments);

    if (!i_state.sibling) {
        throw ( new Error("ImageState inappropriately called. Missing sibling"));
    }

    // Private vars
    var self = this;
    var sibling = i_state.sibling;
    var form_build_id = null;
    var load_form_count = 0;
    var upload_img_count = 0;
    const max_load_form = 5;
    var spinner = $('#spinner');
    var proof_btn = $('#get-your-proof');
    var proof_elm = $('#your-proof');
    var alive = true;
    var local_img_uri = null;
    const hack_upload_uri = c_web_site + '/hack-upload-form';


    // Private class
    function FormParams() {
        if (!form_build_id) {
            throw(new Error("No sensible img_build_id"));
        }
        this.form_build_id = form_build_id;
        this.form_id = 'hack_upload_form';
        this.op = 'Upload';
    }


    // Private funcs
    function _cleanup() {
        proof_elm.attr('src', proof_elm.attr('def_src'));
    }

    function _upload_image() {
        var img_file_name_matches = local_img_uri.match(/.*\/(\w+\.jpg)/);
        var img_file_name = img_file_name_matches[1];
        console.log("File name part of " + local_img_uri + " is img_file_name");

        // Start uploading pic in the background
        var form_params = new FormParams();
        var options = new FileUploadOptions();
        options.fileKey = "files[new_file]";
        options.fileName = img_file_name;
        options.mimeType = "image/jpeg";
        options.headers = {
            Authorization: self.parent().user().getAuth(),
            Host: c_host,
            Connection: "keep-alive",
            Referer: hack_upload_uri
        };

        options.params = form_params;

        console.log('' + dump(options));

        var ft = new FileTransfer();
        ft.upload(
            local_img_uri,
            hack_upload_uri,
            _success_form_upload,
            _fail_form_upload,
            options,
            true // debug!
        );
    }

    function _success(img_uri) {
        if (!alive) return;
        local_img_uri = img_uri;
        spinner.hide();
        proof_btn.hide();
        proof_elm.attr('src', img_uri);
        proof_elm.show();
        self.parent().switchState({state: c_submit_state, resume: sibling});

        _upload_image();
    }

    function _fail() {
        if (!alive) return;
        spinner.hide();
        self.cancel();
        self.parent().switchState({state: c_submit_state, resume: sibling});
    }

    function _success_form_id(data) {
        if (!alive) return;
        var matches = /name="form_build_id"\s+value="(form-.+?)"/gm.exec(data);
        if (matches && matches.length) {
            form_build_id = matches[1];
            console.log('Form build id:' + form_build_id);
        }
        else {
            console.log('Bad regex!!!?');
        }
    }

    function _fail_form_id() {
        if (alive) {
            if (++load_form_count <= max_load_form) {
                _fetch_image_upload_form();
            } else {
                alert("Can't reach server, so can't upload image");
            }
        }
    }

    function _success_form_upload(data) {
        if (!alive) return;
        if (typeof(response) == "object" && response.uuid) {
            sibling.setProof(data.response, self);
        } else {
            console.log("Bad image upload response:" + dump(data.response))
        }
    }

    function _fail_form_upload(err) {
        if (!alive) return;
        console.log("Failed to upload image:" + err);
        if (++upload_img_count <= max_load_form) {
            _upload_image();
        } else {
            alert("Failed to upload image after trying " + max_load_form + "\nVery trying indeed");
        }
        _cleanup();
        alive = false;
    }

    function _fetch_image_upload_form() {
        $.ajax({
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", parent.user().getAuth());
            },
            url: hack_upload_uri,
            type: 'GET'
        }).done(_success_form_id).fail(_fail_form_id);
    }


    // Public funcs
    this.update = function () {

    };

    this.cancel = function () {
        alive = false;
        _cleanup();
    };

    this.done = function () {
        alive = false;
        _cleanup();
    };

    // Initialize state
    _fetch_image_upload_form();

    if (navigator.camera && navigator.camera.getPicture) {
        navigator.camera.getPicture(_success, _fail,
            {
                quality: 75,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: Camera.PictureSourceType.CAMERA,
                mediaType: Camera.MediaType.PICTURE,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 800,
                targetHeight: 800,
                cameraDirection: Camera.Direction.BACK,
                correctOrientation: true,
                saveToPhotoAlbum: false
            });
    } else {
        alert("You lied!\nThere's no camera here...");
    }
}

// Take care of entering and uploading lies
function LieState(i_state) {
    if (typeof(i_state) != "object") {
        throw(new Error("Invalid parameter when initializing LieState\n" + dump(i_state)));
    }

    State.apply(this, arguments);

    // Private vars
    var self = this;
    var proof = null;
    var spinner = $('spinner');
    var input_lie = $('#brand-new-lies');
    var btn_tell = $('#tell-the-world');
    var btn_snap = $('#get-your-proof');
    var event_sel = "click tap";
    var sibling = null;
    var node = null;
    const proof_base_uri = c_web_site + "/sites/default/files/";


    // Private funcs
    function _submit_cb(msg) {
        if (!node.isReady()) {
            alert("Failed to submit lie: " + msg);
        }
        self.parent().switchState(c_browse_state);
    }

    function _cleanup() {
        // Reset all input fields
        $('#tell-a-lie input').each(function () {
            this.val(this.attr('def_label'));
        });
        // Show all buttons, and turn off their actions
        $('#tell-a-lie a').each(function () {
            this.show();
            this.off(event_sel);
        })
    }

    function _verify_input() {
        if (input_lie.val() == input_lie.attr('def_label')) {
            alert('Pleeeeaaaaaase!');
            return false;
        }
        return true;
    }


    // Public funcs
    this.setProof = function (i_upload_obj, i_sib) {
        proof = i_upload_obj;
        sibling = i_sib; // Keep around for cleanup
    };

    this.update = function () {

    };

    this.cancel = function () {
        if (sibling) sibling.cancel();
        _cleanup();
    };

    this.done = function () {
        if (!_verify_input()) return;
        spinner.show();

        var node_input = {title: input_lie.val(), cb: _submit_cb};
        if (proof) {
            node_input.img_uri = proof.replace('public://', proof_base_uri);
            node_input.img_uuid = proof.uri;
        }
        node = new Node(node_input);

        if (sibling) sibling.done();
        _cleanup();
    };

    // Bind functions to buttons and input fields
    btn_tell.on(event_sel, function () {
        self.done();
    });

    btn_snap.on(event_sel, function () {
        self.parent().switchState({state: c_image_state, sibling: self});
    });
}





