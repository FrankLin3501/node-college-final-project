var express = require('express');
var connection = require('./db.js');
var md5 = require('md5');
var router = express.Router();

/* root page. */
router.all('/*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Method', 'POST');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');

  if (req.path != '/login' && !isLogin(req.session)) {
      //res.json({state: 'falure'});
      res.json({
        hasData: false
      });
  } else {
    next();
  }
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
    res.json(result);  
  });
});

router.post('/login', function(req, res, next) {
  var result = undefined;
  var sql = 'SELECT `UID`, `fullname` FROM `user` WHERE `email`=? AND `password`=?';
  var password = md5(req.param('password'));
  var _uid = -1;
  console.log(req.body);
  connection.query(sql, [req.param('email'), password], function (error, rows, fields) {
    if (error) throw error;
    console.log(error);
    console.log(rows);
    if (rows.length > 0) {
      result = rows[0];
      _uid = result.UID;
    }
    console.log('Result:\t' + JSON.stringify(result));
    if (typeof result === 'undefined') {
      result = {
        isLogin: false,
        uid: undefined,
        email: undefined
      };
    } else {
      req.session.isLogin = 'yes';
      req.session.userID = req.param('email');
      req.session.UID = _uid;
      result = {
        isLogin: true,
        uid: _uid,
        email: req.param('email')
      };
    }
    console.log('Session:\t' + req.session.id);
    res.json(result);
  });
});

router.delete('/logout', function(req, res, next){
  req.session.destroy();  
});

router.post('/getwifi', function(req, res, next) {
  var result = undefined;
  var lat = parseFloat(req.param('lat'));
  var lng = parseFloat(req.param('lng'));
  var uid = req.param('UID');
  var time = parseInt(req.param('time'));
  var date = new Date(time).toLocaleString('zh-TW', {hour12: false});
  var where = 'WHERE `UID`=? ';
  var send = [];
  uid = (typeof uid === 'undefined' ? undefined : parseInt(uid));
  //var sql = 'SELECT * FROM `online` WHERE 1 ORDER BY `UID` ASC';
  if (typeof uid === 'number') {
    send = [uid];
  } else {
    send = [];
    where = '';
  }
  var sql = ''+
  'SELECT *, (ROUND( 1000 * 6371 * acos( cos( radians(' + lat + ') ) * cos( radians( `lat` ) ) * cos( radians( `lng` ) - radians(' + lng + ') ) + sin( radians(' + lat + ') ) * sin(radians(`lat`)) ), 2 )) AS `distance` '+
            'FROM `online` '+
            where +
            'ORDER BY `distance` ASC';

  
  console.log(req.body);
  console.log('Cookies:\t' + req.header('cookie'));
  console.log('Time:\t' + date);
  if (isLogin(req.session)) {
    connection.query(sql, send, function (err, rows) {
      console.log(rows);
      var result = {
        hasData: (rows==undefined?false:true),
        wifi: rows
      };

      console.log('Body:\t\t' + JSON.stringify(result));
      res.json(result);
    });
  } else {
    result = {
      hasData: false,
      wifi: undefined
    };
    res.json(result);
  }
});

router.post('/setwifi', function(req, res, next) {
  var result = undefined;
  var lat = parseFloat(req.param('lat'));
  var lng = parseFloat(req.param('lng'));
  var email = req.param('email');
  var uid = req.param('UID');
  var time = parseInt(req.param('time'));
  var date = new Date(time).toLocaleString('zh-TW', {hour12: false});
  var _wifi = makeWiFiData(uid, email);
  var send = {
    'uid': uid,
    'lat': lat,
    'lng': lng,
    'ssid': _wifi.ssid,
    'password': _wifi.password
  };
  var sql = 'INSERT INTO `online` SET ?';

  console.log(req.body);
  console.log('Cookies:\t' + req.header('cookie'));
  console.log('Time:\t' + date);
  if (isLogin(req.session)) {
    connection.query(sql, send, function (err, rows) {
      if (err) console.log(err);
      console.log(rows);
      var result = JSON.stringify({
        hasData: (rows==undefined?false:true),
        wifi: _wifi
      });

      console.log('Body:\t\t' + result);
      res.send(result);
    });
  } else {
    result = {
      hasData: false,
      wifi: undefined
    };
    res.json(result);
  }
});

// router.post('/closewifi', function (req, res, next) {

//   if (isLogin(req.session)) {
//     var uid = req.session.uid;
    
//   } else {

//   }

// });

router.patch('/online', function (req, res, next) {
  var lat = parseFloat(req.param('lat'));
  var lng = parseFloat(req.param('lng'));
  var uid = req.session.UID;
  var sql = 'UPDATE `wifi`.`online` SET `lat`=?, `lng`=? WHERE `UID`=?';
  var send = [lat, lng, uid];
  var result = {
    state: 400,
    updateState: false
  };
  for (var i in send) {
    if (send[i] == undefined || send.length != 3) {
      res.json(result);
      break;
    }
  }
  connection.query(sql, send, function (err, rows, fields) {
    if (err) throw err;
    
    if (rows.length != 0) {
      result = {
        state: 200,
        updateState: true
      };
      res.json(result);
    }
  });

});

function makeWiFiData(uid, email) {
  var uuid = require('uuid/v4')().toString();
  var _ssid = 'ID' + uid + '_' + email.split('@')[0].toUpperCase();
  var _password = uuid.replace(/-/gi,'');
  return {
    ssid: _ssid,
    password: _password
  };
}


//function for this routing
function isLogin(session) {
  return session.isLogin == 'yes';
}

module.exports = router;
