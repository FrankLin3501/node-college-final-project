var express = require('express');
var connection = require('./db.js');
var md5 = require('md5');
var router = express.Router();



/* GET root page. */
router.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Method", "POST");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.post('/login', function(req, res, next) {
  var result = undefined;
  var sql = 'SELECT `UID`, `fullname` FROM `user` WHERE `email`=? AND `password`=?';
  var password = md5(req.param('password'));
  
  if (!isLogin(req.session)) {
    connection.query(sql, [req.param('email'), password], function (error, rows, fields) {
      if (error) throw error;
      if (typeof rows !== 'undefined') result = rows[0];
      console.log('Result:\t' + JSON.stringify(result));
      if (typeof result === 'undefined') {
        result = {
          isLogin: false,
          email: undefined
        };      
      } else {
        req.session.isLogin = 'yes';
        req.session.userID = req.param('email');
        result = {
          isLogin: true,
          email: req.param('email')
        };
      }
      console.log('Session:\t' + req.session.id);
      res.send(result);
    });
  } else {
    if (req.session.userID == req.param('email')) {
      result = {
        isLogin: true,
        email: req.param('email')
      };
    } else {
      result = {
        isLogin: false,
        email: undefined
      };
    }
    
    res.send(result);
  }
});

router.post('/getwifi', function(req, res, next) {
  var result = undefined;
  var lat = req.param('lat');
  var lng = req.param('lng');
  var sql = 'SELECT * FROM `online` WHERE 1 ORDER BY `UID` ASC';

  
  console.log('Cookies:\t' + req.header('cookie'));
  if (isLogin(req.session)) {
    connection.query(sql, [], function (err, rows) {
      var result = JSON.stringify({
        hasData: rows.length==0?false:true,
        wifi: rows.length==0?undefined:rows
      });

      console.log('Body:\t' + result);
      res.send(result);
    });
  } else {
    result = {
      hasData: false,
      wifi: undefined
    };
    res.send(result);
  }
});

function isLogin(session) {
  return session.isLogin == 'yes';
}

module.exports = router;