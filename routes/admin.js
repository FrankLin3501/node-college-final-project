var express = require('express');
var md5 = require('md5');
var connection = require('./db.js');
var router = express.Router();

/* GET admin page. */
router.get('/', function(req, res) {
  if (isLogin(req.session)) {
    
    res.send('Successful');
  } else {
    res.render('admin/login');
  }  
});

router.post('/login', function(req, res) {
  if (isLogin(req.session)) {
    res.redirect('/');
  } else {
    var result = undefined;
    var sql = 'SELECT `ID`, `username` FROM `admin` WHERE `username`=? AND `password`=?';
    req.body.password = md5(req.body.password);  

    connection.query(sql, [req.body.username, req.body.password],
      function (error, results, fields) {
        if (error) throw error;
        if (typeof results !== 'undefined') result = results[0];
        console.log('Admin[' + result.username + '] is Login at ' + new Date().toLocaleString('zh-TW', {hour12: false}) + '.');

        if (typeof result === 'undefined') {
          res.header('refresh', '1, url=/admin');
          res.send('Login Error');
          
        } else {
          req.session.isAdminLogin = 'yes';
          req.session.userID = req.body.username;
          res.header('refresh', '1, url=/admin');
          res.send(result.username + '<br>Login Successful');
        }
      }
    );
  }
});

function isLogin(session) {
  return session.isAdminLogin == 'yes';
}

module.exports = router;
