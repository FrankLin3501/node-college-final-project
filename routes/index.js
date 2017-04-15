var express = require('express');
var connection = require('./db.js');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  if (isLogin(req.session)) {
    var sql = 'SELECT * FROM `online` ORDER BY `UID` ASC;';
    connection.query(sql, [], function (err, rows) {
      res.render('users/wifidata', {
        username: req.session.userID,
        rows: rows
      });
    });
  } else {
    res.render('index');
  }  
});

router.get('/getWiFi', function(req, res) {

  if (isLogin(req.session)) {
    var sql = 'SELECT * FROM `online` WHERE `UID`=22 ORDER BY `UID` ASC;';
    connection.query(sql, [], function (err, rows) {
      res.send(JSON.stringify(rows[0]));      
    });
  } else {
    res.header('Refresh', '1, url=/');
    res.send('Please Login.');
  }
});

function isLogin(session) {
  return session.isLogin == 'yes';
}

module.exports = router;
