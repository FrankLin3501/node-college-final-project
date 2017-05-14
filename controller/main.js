var dbconnect = require("../routes/db.js");

function signUp(email, passwd) {

}

function hasUser(email) {
    'SELECT COUNT(*) FORM `user` WHERE `email`=?'
    dbconnect.query();
}