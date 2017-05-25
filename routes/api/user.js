/*
Router for '/api/user',
Contain
    ##GET '/user' - login    
    POST '/user/login' - login
        query form table `user`
    POST '/user' - signup
        insert to table `user`
    PUT '/user' - edit profile
        update from `user`
*/

var express = require('express');
var connection = require('../db.js');
var md5 = require('md5');
var router = express.Router();

function checkInput(values, length) {
    var bool = true;
    if (values.length != length) {
        bool = false;
    } else {
        for (var i in values) {
            //console.log(values[i]);
            if (values[i] == '') {
                bool = false;
                break;
            }
        }
    }
    return bool;
}

function sendResult(error, result, res) {
    var RESPONSE_LIST = {
        '200': { message: 'OK' },
        '201': { message: 'Created' },
        '204': { message: 'No Content' },
        '304': { message: 'Not Modified' },
        '400': { message: 'Bad Request' },
        '401': { message: 'Unauthorized' },
        '500': { message: 'Internal Server Error' },
        '1062': { message: 'ER_DUP_ENTRY' },
        '': {}
    };
    if (error == null) {
        result.state = 200;

        console.log('Result\t:\t' + JSON.stringify(result));
    } else {
        result.state = 500;
        result.description = 'Unsupported input data.';
        switch (error.type) {
            case -1:
                error.message = 'DATABASE_ERROR';
                break;
            case -2:
                error.message = 'INPUT_ERROR';
                result.state = 400;
                result.description = error.desc;
                break;
            case -3:
                error.message = 'USER_NOT_EXIST_ERROR';
                result.state = 400;
                result.description = error.desc;
                break;
            default:
                error.message = 'UNKNOW_ERROR';

                break;
        }
        console.log('Error\t:\t' + JSON.stringify(error.err));
        console.log('\t\t[' + error.type + ']' + error.message);
    }
    result.message = RESPONSE_LIST[result.state].message;
    res.json(result);
}

router.all('/*', function (req, res, next) {
    var pass = true;
    switch (req.method) {
        case 'POST':
            if (req.path == '/login')
                pass = checkInput([req.param('email'), req.param('password')], 2);
            else if (req.path == '/')
                pass = checkInput([req.param('fullname'), req.param('email'), req.param('password')], 3);
            break;
        case 'DELETE':
            pass = true;
            break;
    }

    if (pass) {
        next();
    } else {
        var error = { type: -2, desc: 'Input data is null or has illegal character.' };
        sendResult(error, {}, res);
    }
});

//login
router.post('/login', function (req, res, next) {
    var sql = 'SELECT `UID`, `email`, `fullname` FROM `user` WHERE `email`=? AND `password`=?';
    var values = [req.body.email, md5(req.body.password)];

    connection.query(sql, values, function (err, rows) {
        var result = { isLogin: false };
        var error = null;
        var row = rows.pop();

        if (err) {
            error = { type: -1, err: err };
        } else if (row != undefined) {
            result.isLogin = req.session.isLogin = true;
            result.user = req.session.user = row;
            result.description = "Login Successfully, see node 'user'.";
            console.log('Session\t:\t' + req.session.id);
        } else {
            error = { type: -3 };
        }
        sendResult(error, result, res);
    });
});

//signup
//add user
router.post('/', function (req, res, next) {
    var sql = 'INSERT INTO `user` SET `fullname`=?, `email`=?, `password`=?';
    var values = [req.body.fullname, req.body.email, md5(req.body.password)];

    connection.query(sql, values, function (err, rows) {
        var result = undefined;
        if (err) {
            //console.log(err);
            result = { state: err.errno, message: err.code };
            switch (result.state) {
                case 1062:
                    result.description = 'E-mail already in use.';
                    break;
                case 1048:
                    result.description = 'Sign up information is incomplete.';
                    break;
                default:
            }
        } else {
            console.log('Rows\t:\t' + JSON.stringify(rows));
            var row = rows;
            if (row != undefined) {
                result = {
                    description: 'Sign Up Successful.',
                    user: {
                        UID: row.insertId,
                        fullname: req.body.fullname,
                        email: req.body.email
                    }
                };
            }
            sendResult(null, result, res);
            return;
        }

        console.log('Result\t:\t' + JSON.stringify(result));
        res.json(result);
    });

});

router.delete('/', function (req, res, next) {
    req.session.destroy();
});

module.exports = router;
