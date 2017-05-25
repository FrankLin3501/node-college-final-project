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
            if (values[i] == '') {
                bool = false;
                break;
            }
        }
    }
    return bool;
}

router.all('/*', function (req, res, next) {
    var pass = true;
    switch (req.method) {
        case 'POST':
            if (req.path == '/login')
                pass = checkInput([req.param('email'), req.param('password')], 2);

            break;
        case 'POST':
            pass = checkInput([req.param('fullname'), req.param('email'), req.param('password')], 3);

            break;
        case 'DELETE':
            pass = true;
            break;
    }

    if (pass) {
        next();
    } else {
        res.json({
            state: 400,
            message: 'Bad Request',
            description: 'Wrong input'
        });
    }
});

//login
router.post('/login', function (req, res, next) {
    var sql = 'SELECT `UID`, `email`, `fullname` FROM `user` WHERE `email`=? AND `password`=?';
    var email = req.param('email');
    var password = md5(req.param('password'));
    var values = [email, password];

    connection.query(sql, values, function (err, rows, fields) {
        var result = {
            isLogin: false,
            user: undefined
        };

        if (err) {
            console.log(err);
            throw err;
        }
        var row = rows.pop();
        while (row != undefined) {
            req.session.isLogin = true;
            req.session.user = row;
            result = {
                isLogin: true,
                user: row
            };
            row = undefined;
        }

        console.log('Result\t:\t' + JSON.stringify(result));
        console.log('Session\t:\t' + req.session.id);
        res.json(result);
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
            switch (err.errno) {
                case 1062:
                    result = {
                        state: 1062,
                        message: err.code,
                        description: '[Error] E-mail already in use.'
                    };
                //break;
                case 1048:
                    result = {
                        state: 1048,
                        message: err.code,
                        description: '[Error] Sign up information is incomplete.'
                    };
                    break;
                default:
                //throw err;            
            }
        } else {
            console.log('Rows\t:\t' + JSON.stringify(rows));            
            var row = rows;
            while (row != undefined) {
                result = {
                    state: 200,
                    message: 'OK',
                    description: 'Sign Up Successful.',
                    UID: row.insertId
                };
                row = undefined;
            }
        }

        console.log('Result\t:\t' + JSON.stringify(result));
        res.json(result);
    });

});

router.delete('/', function (req, res, next) {
    req.session.destroy();
});

module.exports = router;
