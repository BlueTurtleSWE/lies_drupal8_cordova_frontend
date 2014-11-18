// Constants
const init_state = 0;
const browse_state = 1;
const stalk_state = 2;
const login_state = 3;
const submit_state = 4;

const c_web_site = 'http://lies.hazardous.se';
const g_debug = true;

// Initializing globals
var g_curr_user = null;
var g_stalk_user = null;
var g_node_submit = null;



// TODO: old - migrate to OOP implementation, any globals needed move to above



const web_site = 'http://lies.hazardous.se';
const list_uri = web_site + '/latest-lies';
const hack_upload_uri = web_site + '/hack-upload-form';

// Initializing globals
var current_state = init_state;
var img_build_id = null;
var img_uuid = null;
var img_dest_uri = null;




// The onload stuff
document.addEventListener('deviceready', function () {
    console.log("Device ready");

    if (!window.btoa) window.btoa = $.base64.btoa;
    if (!window.atob) window.atob = $.base64.atob;

    document.addEventListener('backbutton', cancel, false); // Fix the back button on Android

    if (window.localStorage) {
        var user_hal_loaded = JSON.parse(window.localStorage.getItem("user"));
        if (user_hal_loaded != null) {
            g_curr_user = new User(user_hal_loaded);
        }
    }

    init_lies();
}, false);


// Customize alert box
if (navigator.notification) {
    window.alert = function (txt) {
        navigator.notification.alert(txt, null, "Warning", "Ok");
    }
}


// State functions

function init_lies() {
    console.log('init_lies');
    focus_browse();
}

function focus_browse() {
    current_state = browse_state;
    state_show_hide();
    $.mobile.changePage('#latest-lies', 'slide', true, true);

    $.ajax({
        headers: {
            Accept: "application/hal+json"
        },
        type: 'GET',
        url: list_uri
    }).done(browse_display).fail(error_display);
}

function focus_stalk(stalkee) {
    current_state = stalk_state;
    state_show_hide();
    if (!g_curr_user) {
        focus_login(stalk_state, stalkee);
        return;
    }
    $.mobile.changePage('#check-a-liar', 'slide', true, true);
    var stalk_uid = null;

    if (typeof(stalkee) == 'number') {
        stalk_uid = stalkee;
        console.log("Check out user "+stalk_uid);
    } else {
        var uid_matches = stalkee.match(/\d+$/);
        stalk_uid = uid_matches[0];
        console.log("Exstracted uid "+stalk_uid+" - let's check it out");
    }

    g_stalk_user = new User({uid : stalk_uid, cb : stalk_display });
}

function focus_login(next_state, data) {
    current_state = login_state;
    state_show_hide();
    if (!data) {
        data = '';
    }
    $('#next-state').val(next_state);
    $('#next-state-data').val(encodeURI(data));
    $.mobile.changePage('#identity-lies', 'slide', true, true);

    if (g_curr_user) {
        $('#register-alias').val(g_curr_user.getName());
        var mail = g_curr_user.getMail()?g_curr_user.getMail():$('#register-email').attr('def_label');
        $('#register-email').val(mail);
        $('#register-password').val($('#register-password').attr('def_label'));

        $('#btn-login').hide();
        $('#btn-create-user').hide();
        $('#btn-edit-user').show();
        $('#btn-logout').show();
    } else {
        $('#btn-login').show();
        $('#btn-create-user').show();
        $('#btn-edit-user').hide();
        $('#btn-logout').hide();
    }

    $('#spinner').hide();
}

function focus_submit() {
    current_state = submit_state;
    state_show_hide();
    if (!g_curr_user) {
        focus_login(submit_state);
        return;
    }
    img_build_id = null;
    img_uuid = null;
    img_dest_uri = null;
    $('#your-proof').show();
    $('#your-proof').attr('src', $('#your-proof').attr('def_src'));
    $('#get-your-proof').show();
    $('#brand-new-lies').val($('#brand-new-lies').attr('def_label'));
    $.mobile.changePage('#tell-a-lie', 'slide', true, true);
    $('#spinner').hide();

    // Fetch the form at and rip out the form_build_id and form_token
    $.ajax({
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", g_curr_user.getAuth());
        },
        url: 'http://lies.hazardous.se/hack-upload-form',
        type: 'GET'
    }).done(extract_form_id).fail(no_form_id);

}

function cancel() {
    // Use this function to clean up the pages
    switch (current_state) {
        case stalk_state:
            $('#list-of-liars-lies').empty(); // In case we come from the stalk page
            break;
        case login_state:
            break;
        case submit_state:
            break;
    }
    focus_browse();
}

function state_show_hide() {
    $('#spinner').show();
    g_node_submit = null; // Should never survive a state change
    switch (current_state) {
        case browse_state:
            $('#btn-refresh').show();
            $('#btn-back').hide();
            break;
        default:
            $('#btn-refresh').hide();
            $('#btn-back').show();
            break;
    }
}

// Data handlers

function browse_display(response) {
    var list_elm = $('#list-of-lies');
    list_elm.empty();
    for (var i = 0; i < response.length; ++i) {
        var node = new Node(response[i]);
        list_elm.append(node.render());
    }
    $('#spinner').hide();
}

function error_display(msg) {
    $('#list-of-lies').append('<div id="000" class="item-lie">'
    + '<div class="item-title">Somthing broke</div>'
    + '<div class="item-liar">Blame Master Liar</div>'
    + '</div>');
    console.log(msg);
    $('#spinner').hide();
}

function stalk_display(response) {
    var list_elm = $('#list-of-liars-lies');
    list_elm.empty();

    if (!(g_stalk_user && g_stalk_user.isReady())) {
        throw ( new Error ( "Failed to load user" ) );
    }

    list_elm.append( g_stalk_user.render() );

    $('#spinner').hide();
}


// Form handlers

function focus_input(elm) {
    if ($(elm).attr('def_label') == $(elm).val()) {
        $(elm).val('');
    }
}

function blur_input(elm) {
    if ($(elm).val() == '') {
        $(elm).val($(elm).attr('def_label'));
    }
}


// Login helpers
function validate_liar_cred(check_email) {
    var u_ret = { };
    if ($('#register-alias').val() == $('#register-alias').attr('def_label')) {
        alert("Please pick an alias");
        return null;
    } else {
        u_ret.name = $('#register-alias').val();
    }
    if ($('#register-password').val() == $('#register-password').attr('def_label')) {
        alert("Please enter your password");
        return null;
    } else {
        u_ret.pass = $('#register-password').val();
    }
    if (check_email === true) {
        if ($('#register-email').val() == $('#register-email').attr('def_label')) {
            alert("Please enter your email");
            return null;
        } else {
            u_ret.mail = $('#register-email').val();
        }
    }

    return u_ret;
}

function create_liar() {
    var u_data = validate_liar_cred(true);
    if (!u_data) return;
    $('#spinner').show();

    u_data.cb = login_liar_cb;
    u_data.edit = true;
    g_curr_user = new User(u_data);
}

function edit_liar() {
    alert('Editing user data not yet supported');
}

function login_liar() {
    var u_data = validate_liar_cred(false);
    if (!u_data) return;

    u_data.cb = login_liar_cb;
    u_data.edit = false;
    g_curr_user = new User(u_data);
}

function login_liar_cb (msg){
    $('#spinner').hide();
    if (!g_curr_user.isReady()) {
        alert(msg);
        return;
    }

    // Save user data
    if (window.localStorage) {
        window.localStorage.setItem('user', g_curr_user.getJSON());
    }

    // Now find out where to go!
    var next_state = parseInt($('#next-state').val());
    var data = decodeURI($('#next-state-data').val());
    switch (next_state) {
        case submit_state:
            return focus_submit();
        case stalk_state:
            return focus_stalk(data);
        default:
            return cancel();
    }
}

function logout_liar () {
    g_curr_user = null;
    if (window.localStorage) {
        window.localStorage.removeItem('user');
    }
    cancel();
}

// Tattletale!!!
function submit_your_lie() {
    if ($('#brand-new-lies').val() == $('#brand-new-lies').attr('def_label')) {
        alert("Pleeeeease tell us!");
        return false;
    }
    $('#spinner').show();

    var node_input = {title: $('#brand-new-lies').val(), cb: submit_cb };
    if (img_uuid) {
        var img_dest_href = img_dest_uri.replace('public://', the_proof_base_uri);
        node_input.img_uri = img_dest_href;
        node_input.img_uuid = img_uuid;
    }
    g_node_submit = new Node(node_input);

}

function submit_cb(msg) {
    if (!g_node_submit.isReady()) {
        alert("Failed to submit lie: "+msg);
        return cancel();
    }
    return focus_browse();
}

function extract_form_id(data) {
    var form_matches = data.match(/\<form[\s\S]*\<\/form\>/gm);
    //console.log("Form:" + form_matches[0]);
    var matches = /name="form_build_id"\s+value="(form-.+?)"/gm.exec(data);
    if (matches && matches.length) {
        img_build_id = matches[1];
        console.log('Form build id:' + img_build_id);
    }
    else {
        console.log('Bad regex!!!');
    }
}

function no_form_id(obj, err, thrown) {
    alert('Image upload is currently offline. Take a nice pic if you like to, but don\'t expect me to do anything with it!');
}

function snap_a_pic() {
    if (navigator.camera && navigator.camera.getPicture) {
        navigator.camera.getPicture(snap_a_pic_success, snap_a_pic_fail,
            {
                quality: 45,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: Camera.PictureSourceType.CAMERA,
                mediaType: Camera.MediaType.PICTURE,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 500,
                targetHeight: 500,
                mediaType: Camera.MediaType.PICTURE,
                cameraDirection: Camera.Direction.BACK,
                correctOrientation: true,
                saveToPhotoAlbum: false
            });
    } else {
        alert("You lied!\nThere's no camera here...");
    }
}

function FormParms() {
    if (!img_build_id) {
        throw(new Error("No sensible img_build_id"));
    }
    this.form_build_id = img_build_id;
    this.form_id = 'hack_upload_form';
    this.op = 'Upload';
    return this;
}

function snap_a_pic_success(img_uri) {
    $('#spinner').hide();
    $('#get-your-proof').hide();
    $('#your-proof').attr('src', img_uri);
    $('#your-proof').show();

    var img_file_name_matches = img_uri.match(/.*\/(\w+\.jpg)/);
    var img_file_name = img_file_name_matches[1];
    console.log("File name part of " + img_uri + " is img_file_name");

    // Start uploading pic in the background
    var form_params = new FormParms();
    var options = new FileUploadOptions();
    options.fileKey = "files[new_file]";
    options.fileName = img_file_name;
    options.mimeType = "image/jpeg";
    options.headers = {
        Authorization: g_curr_user.getAuth(),
        Host: 'lies.hazardous.se',
        Connection: "keep-alive",
        Referer: hack_upload_uri
    };

    options.params = form_params;

    console.log('' + dump(options));

    var ft = new FileTransfer();
    ft.upload(
        img_uri,
        hack_upload_uri,
        img_post_success,
        img_post_fail,
        options,
        true // debug!
    );
}

function snap_a_pic_fail(err) {
    console.log('Snap fail:' + err);
    $('#spinner').hide();
}

function img_post_success(data) {
    var resp_obj = JSON.parse(data.response);
    console.log('Image upload response: ' + data.response);
    if (!resp_obj) {
        alert('Error: Image upload failed');
    } else if (resp_obj.uuid != 0) {
        img_uuid = resp_obj.uuid;
        img_dest_uri = resp_obj.uri;
        //alert('Image uploaded');
    } else {
        alert('Error: Image upload aborted');
        img_uuid = 0;
        img_dest_uri = null;
    }
}

function img_post_fail(err) {
    alert('Error: Image upload failed badly');
    console.log(dump(err, 4));
}
