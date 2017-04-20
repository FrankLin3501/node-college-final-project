var express = require('express');
var connection = require('./db.js');
var md5 = require('md5');
var router = express.Router();


/* GET users listing. */
router.get('/', function(req, res) {
  res.send('<a href="/users/create">Create New User</a>');
  
});

//create new user
router.get('/create', function(req, res) {
  res.render('users/newusers');
});

router.post('/add', function(req, res) {  
  var result = '';
  var sql = 'INSERT INTO `user` SET ?';

  req.body.password = md5(req.body.password);
  console.log(req.body);

  connection.query(sql, req.body, function (err, results) {
    if (err) {
      throw err;
    }
    result = results;
  });
  
  res.send(result);
});

//login from user
router.post('/login', function(req, res) {
  var result = undefined;
  var sql = 'SELECT `UID`, `fullname` FROM `user` WHERE `email`=? AND `password`=?';
  req.body.password = md5(req.body.password);  
  
  connection.query(sql, [req.body.email, req.body.password],
    function (error, results, fields) {
      if (error) throw error;
      if (typeof results !== 'undefined') result = results[0];
      console.log(result.fullname + '(' + req.body.email + ')]is Login at ' + new Date().toLocaleString('zh-TW', {hour12: false}) + '.');

      if (typeof result === 'undefined') {
        res.header('refresh', '1, url=/');
        res.send('Login Error');
        
      } else {
        req.session.isLogin = 'yes';
        req.session.userID = req.body.email;
        res.header('Refresh', '1, url=/');
        res.send(result.fullname + '<br>Login Successful');
      }
    }
  );
});

module.exports = router;