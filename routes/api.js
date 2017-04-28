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

router.post('/signup', function(req, res, next) {
  var result = '';
  var sql = 'INSERT INTO `user` SET ?';
  if (typeof req.body.fullname === 'undefined' || req.body.fullname == '')
    req.body.fullname = null;
  if (typeof req.body.email === 'undefined' || req.body.email == '')
    req.body.email = null;
  if (typeof req.body.password === 'undefined' || req.body.password == '')
    req.body.password = null;
	else
		req.body.password = md5(req.body.password);
  console.log(req.body);  

  connection.query(sql, req.body, function (err, results) {
    console.log(results);
    if (err) {
      console.log(err.errno);
      switch (err.errno) {
        case 1062:
          result = {
            state:  1062,
            message: '[Error] E-mail already in use.'
          };
          break;
        case 1048:
          result = {
            state:  1048,
            message:  '[Error] Sign up information is incomplete.'
          }
          break;
        default:
          throw err;
          break;
      }
    } else {
      if (typeof results !== 'undefined') {
        result = {
          state: 1,
          message: 'Sign Up Successful.',
          UID: results.insertId
        };
      }
    }
    res.send(result);  
  });
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
  var lat = parseFloat(req.param('lat'));
  var lng = parseFloat(req.param('lng'));
  var time = parseInt(req.param('time'));
  var date = new Date(time).toLocaleString('zh-TW', {hour12: false});
  var sql = 'SELECT * FROM `online` WHERE 1 ORDER BY `UID` ASC';
  
  console.log(req.body);
  console.log('Cookies:\t' + req.header('cookie'));
  console.log('Time:\t' + date);
  if (isLogin(req.session)) {
    connection.query(sql, [], function (err, rows) {
      var result = JSON.stringify({
        hasData: rows.length==0?false:true,
        wifi: rows.length==0?undefined:rows
      });

      console.log('Body:\t\t' + result);
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



//function for this routing
function isLogin(session) {
  return session.isLogin == 'yes';
}

module.exports = router;
