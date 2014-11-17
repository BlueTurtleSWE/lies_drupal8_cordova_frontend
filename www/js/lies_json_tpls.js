
// The HAL+JSON templates in all their glory

const the_proof_type = "http:\/\/lies.hazardous.se\/rest\/relation\/node\/a_lie\/field_the_proof";
const the_proof_relation = "http:\/\/lies.hazardous.se\/rest\/relation\/node\/a_lie\/field_the_proof";
const the_proof_base_uri = "http://lies.hazardous.se/sites/default/files/";
const submit_a_lie_tpl = {
    "_links": {"type": {"href": "http:\/\/lies.hazardous.se\/rest\/type\/node\/a_lie"}},
    "type": [{"target_id": "a_lie"}],
    "langcode": [{"value": "en"}],
    "title": [{"value": '%TITLE%', "lang": "en"}],
 /*   "field_the_proof": [
        {
            "uuid": '%UUID',
            "type": {"href": "http:\/\/lies.hazardous.se\/rest\/type\/file\/file"}
        }
    ],*/
    "status": [{"value": "1", "lang": "en"}],
    "promote": [{"value": "1", "lang": "en"}],
    "sticky": [{"value": "0", "lang": "en"}]/*,
    "_embedded": {
        "http:\/\/lies.hazardous.se\/rest\/relation\/node\/a_lie\/field_the_proof": [{
            "uuid": [{"value": "%UUID"}]
        }]
    }*/
};





const submit_a_lie_w_img_tpl = {
    "_links": {
        "self": {"href": "http:\/\/lies.hazardous.se\/node\/1"},
        "type": {"href": "http:\/\/lies.hazardous.se\/rest\/type\/node\/a_lie"},
        "http:\/\/lies.hazardous.se\/rest\/relation\/node\/a_lie\/field_the_proof": [{"href": "http:\/\/lies.hazardous.se\/sites\/default\/files\/Sudtiroler_bergturnfest_club_participation_statistics.png"}]
    },
    "type": [{"target_id": "a_lie"}],
    "langcode": [{"value": "en"}],
    "title": [{"value": "Lies, damn lies and... Test from app?", "lang": "en"}],
    "_embedded": {
        "http:\/\/lies.hazardous.se\/rest\/relation\/node\/a_lie\/field_the_proof": [
            {
                "_links": {
                    "self": {"href": "http:\/\/lies.hazardous.se\/sites\/default\/files\/Sudtiroler_bergturnfest_club_participation_statistics.png"},
                    "type": {"href": "http:\/\/lies.hazardous.se\/rest\/type\/file\/file"}
                },
                "uuid": [{"value": "e60c7831-b957-4912-bf4e-78bb3d0b588d"}],
                "uri": [{"value": "http:\/\/lies.hazardous.se\/sites\/default\/files\/Sudtiroler_bergturnfest_club_participation_statistics.png"}]
            }
        ]
    },
    "status": [{"value": "1", "lang": "en"}],
    "promote": [{"value": "1", "lang": "en"}],
    "sticky": [{"value": "0", "lang": "en"}]
};






const create_user_tpl = {
    "_links": {"type": {"href": "http:\/\/lies.hazardous.se\/rest\/type\/user\/user"}},
    "name": [{"value": '%USER%'}],
    "mail": [{"value": '%EMAIL%'}],
    "pass": [{"value": '%PASSWORD%'}],
    "status": [{"value": 1}]
};
const submit_a_lie_headers = {
    Accept: "application/hal+json",
    'Content-Type': "application/hal+json"
};

const create_user_headers = {
    Accept: "application/hal+json",
    'Content-Type': "application/hal+json"
};

function create_user_before_func (xhr) {
    xhr.setRequestHeader("Authorization","Basic TWFzdGVyIExpYXI6dGVzdA==");
}