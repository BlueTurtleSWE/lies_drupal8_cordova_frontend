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


const proof_label = "http:\/\/lies.hazardous.se\/rest\/relation\/node\/a_lie\/field_the_proof";
const liar_label = "http:\/\/lies.hazardous.se\/rest\/relation\/node\/a_lie\/uid";


const web_site = 'http://lies.hazardous.se';
const list_uri = web_site + '/latest-lies';
const create_user_uri = web_site + '/entity/user/';
const submit_lie_uri = web_site + '/entity/node/';
const hack_upload_uri = web_site + '/hack-upload-form';

// Initializing globals // TODO: old - migrate to above
var current_state = init_state;
var user_data = null;
var img_build_id = null;
var img_token = null;
var img_uuid = null;
var img_dest_uri = null;

function user_data_tpl() {
    this.alias = null;
    this.email = null;
    this.passwd = null;
    this.auth_header = null;
    return this;
}


// The onload stuff
document.addEventListener('deviceready', function () {
    console.log("Device ready");

    if (!window.btoa) window.btoa = $.base64.btoa;
    if (!window.atob) window.atob = $.base64.atob;

    if (window.localStorage) {
        var user_data_loaded = JSON.parse(window.localStorage.getItem("user"));
        if (user_data_loaded != null) {
            g_curr_user = new User(user_data_loaded);
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
    }).success(browse_display).fail(error_display);
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
    img_token = null;
    img_uuid = null;
    img_dest_uri = null;
    $('#your-proof').show();
    $('#your-proof').attr('src', $('#your-proof').attr('def_src'));
    $('#get-your-proof').show();
    $('#brand-new-lies').val($('#brand-new-lies').attr('def_label'));
    $.mobile.changePage('#tell-a-lie', 'slide', true, true);
    $('#spinner').hide();

    // Fetch the form at  and rip out the form_build_id and form_token
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
    switch (current_state) {
        case browse_state:
            $('#list-toolbar').show();
            break;
        default:
            $('#list-toolbar').hide();
    }
}

// Data handlers

function browse_display(response) {
    var list_elm = $('#list-of-lies');
    list_elm.empty();
    for (var i = 0; i < response.length; ++i) {
        var lie_title = response[i].title[0].value;
        var lie_created = response[i].created[0].value;
        var lie_proof = response[i]._embedded[proof_label] ? response[i]._embedded[proof_label][0]._links.self.href : false;
        var lie_liar = response[i]._embedded[liar_label][0]._links.self.href;
        var new_lie_div_text = '<div id="' + lie_created + '" class="item-lie">'
            + '<div class="item-title">' + lie_title + '</div>'
            + (lie_proof ? ('<img class="item-proof" src="' + lie_proof + '"/>') : '')
            + '<a href="#" onClick="focus_stalk(\'' + lie_liar + '\');"><div class="item-liar">Who lied?</div></a>'
            + '</div>';
        list_elm.append(new_lie_div_text);
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

    var liar = 'Error, no I mean the guy in that village in Zelda 2';
    if (g_stalk_user && g_stalk_user.isReady()) {
        liar = g_stalk_user.getName();
    }

    list_elm.append(
        '<div class="item-lie"><div class="item-title">The Liar is: ' + liar + "</div></div>"
    );
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

    // Now find out where to go!
    var next_state = parseInt($('#next-state').val());
    var data = decodeURI($('#next-state-data').val());
    switch (next_state) {
        case submit_state:
            return focus_submit();
        case stalk_state:
            return focus_stalk(data);
        default:
            alert('Unknown state ' + next_state + ' after logging in!');
            return cancel();
    }
}


// Tattletale!!!
function submit_your_lie() {
    if ($('#brand-new-lies').val() == $('#brand-new-lies').attr('def_label')) {
        alert("Pleeeeease tell us!");
        return false;
    }
    $('#spinner').show();
    var headers_obj = submit_a_lie_headers;
    var data_obj = null;

    if (img_uuid) {
        var img_dest_href = img_dest_uri.replace('public://', the_proof_base_uri);
        data_obj = submit_a_lie_w_img_tpl;
        data_obj._links[the_proof_relation][0].href = img_dest_href;

        data_obj._embedded[the_proof_relation][0]._links.self = img_dest_href;
        data_obj._embedded[the_proof_relation][0].uuid[0].value = img_uuid;
        data_obj._embedded[the_proof_relation][0].uri[0].value = img_dest_href;
    } else {
        data_obj = submit_a_lie_tpl;
        alert('Have no image, will post');
    }
    data_obj.title[0].value = $('#brand-new-lies').val();

    var data_json = JSON.stringify(data_obj);
    console.log('Submitting:' + data_json);

    $.ajax({
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", g_curr_user.getAuth());
        },
        headers: headers_obj,
        type: 'POST',
        data: data_json,
        url: submit_lie_uri
    }).done(submit_success).fail(submit_fail).always(function (data) {
        console.log('Submit over');
        focus_browse();
    });
}

function submit_success(data) {
    console.log('Submit success');
    alert('Your submission to the master has been acknowledged - please proceed');
    focus_browse();
}

function submit_fail(obj, err, thrown) {
    if (err == 'parsererror') {
        return submit_success(obj);
    } else {
        alert('Sorry, no cake for you...');
    }
    console.log('Submit fail:' + err + "\nIt threw this:" + dump(thrown, 5));
    $('#spinner').hide();
}

function extract_form_id(data) {
    var form_matches = data.match(/\<form[\s\S]*\<\/form\>/gm);
    console.log("Form:" + form_matches[0]);
    var matches = /name="form_build_id"\s+value="(form-.+?)"/gm.exec(data);
    if (matches && matches.length) {
        img_build_id = matches[1];
        console.log('Form build id:' + img_build_id);
    }
    else {
        console.log('Bad regex!!!');
    }
    matches = /name="form_token"\s+value="(.*?)"/gm.exec(data);
    if (matches && matches.length) {
        img_token = matches[1];
        console.log('Form token:' + img_token);
    }
    else {
        console.log('Found no token. Did form login not work?');
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
    if (img_token) {
        this.form_token = img_token;
    }
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
