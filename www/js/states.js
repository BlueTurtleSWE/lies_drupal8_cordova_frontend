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

    const my_type = 'State (basic class)';
    var next_state = i_state.next_state;
    var parent = i_state.parent;

    this.type = function () {
        throw ( new Error ("You must override the state.type() function!") );
        return my_type;
    }

    this.parent = function () {
        return parent;
    }

    this.nextState = function () {
        return next_state;
    }

    this.init = function (arg_obj) {
        console.log("Override function init() in class "+this.type());
    }

    this.update = function () {
        console.log("Override function update() in class "+this.type());
    }

    this.done = function () {
        console.log("Override function done() in class "+this.type());
        return this.nextState();
    }

    this.cancel = function () {
        console.log("Override function cancel() in class "+this.type());
        return this.nextState();
    }
}




// There can only be one! This state is never killed (as long as the app is running)
// Thus, it has no next state - but is simply sleeping when other states are active
function BrowseState(i_state) {
    if (typeof(i_state) != "object") {
        throw(new Error("Invalid parameter when initializing BrowseState\n" + dump(i_state)));
    }

    State.apply(this, arguments);
}

// Display all about the individual you want to stalk
function StalkState(i_state) {
    if (typeof(i_state) != "object") {
        throw(new Error("Invalid parameter when initializing StalkState\n" + dump(i_state)));
    }
    if (!i_state.uid) {
        throw(new Error("Invalid parameters "))
    }

    State.apply(this, arguments);
}

// Take care of logging in/out or editing preferences
function LoginState(i_state) {
    if (typeof(i_state) != "object") {
        throw(new Error("Invalid parameter when initializing LoginState\n" + dump(i_state)));
    }

    State.apply(this, arguments);
}

// Take care of snapping and uploading images
function ImageState(i_state) {
    if (typeof(i_state) != "object") {
        throw(new Error("Invalid parameter when initializing ImageState\n" + dump(i_state)));
    }

    State.apply(this, arguments);
}

// Take care of entering and uploading lies
function LieState(i_state) {
    if (typeof(i_state) != "object") {
        throw(new Error("Invalid parameter when initializing LieState\n" + dump(i_state)));
    }

    State.apply(this, arguments);
}