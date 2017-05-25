var express = require('express');
var connection = require('./db.js');
var md5 = require('md5');
var router = express.Router();

/* root page. */
router.all('/*', function (req, res, next) {
  var datetime = new Date();

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Method', 'POST');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');

  console.log('Time\t:\t' + getDateTime());
  console.log('Receive\t:\t' + JSON.stringify(req.body));

  if (req.path.indexOf('/user') == 0) {
    next();
  } else if (req.path != '/user/login' && !isLogin(req.session)) {
    res.json({
      hasData: false
    });
  } else {
    console.log('Cookies\t:\t' + req.header('cookie'));
    console.log('Session\t:\t' + JSON.stringify(req.session));
    console.log('User\t:\t' + JSON.stringify(req.session.user));
    next();
  }

});

router.use('/user', require('./api/user.js'));
// //signup
// router.post('/signup', function (req, res, next) {
//   var result = '';
//   var sql = 'INSERT INTO `user` SET ?';
//   if (typeof req.body.fullname === 'undefined' || req.body.fullname == '')
//     req.body.fullname = null;
//   if (typeof req.body.email === 'undefined' || req.body.email == '')
//     req.body.email = null;
//   if (typeof req.body.password === 'undefined' || req.body.password == '')
//     req.body.password = null;
//   else
//     req.body.password = md5(req.body.password);

//   connection.query(sql, req.body, function (err, rows) {
//     console.log(rows);
//     if (err) {
//       console.log(err.errno);
//       switch (err.errno) {
//         case 1062:
//           result = {
//             state: 1062,
//             message: '[Error] E-mail already in use.'
//           };
//           break;
//         case 1048:
//           result = {
//             state: 1048,
//             message: '[Error] Sign up information is incomplete.'
//           }
//           break;
//         default:
//           throw err;
//       }
//     } else {
//       if (typeof rows !== 'undefined') {
//         result = {
//           state: 1,
//           message: 'Sign Up Successful.',
//           UID: rows.insertId
//         };
//       }
//     }
//     res.json(result);
//   });
// });

// //origin is '/signup'
// //add user
// router.post('/user', function (req, res, next) {
//   var sql = 'INSERT INTO `user` SET `fullname`=?, `email`=?, `password`=?';
//   var values = [req.body.fullname, req.body.email, req.body.password];

//   for (var i in values) {
//     if (typeof values[i] === 'undefined' || values[i] == '') {
//       res.json({
//         state: 400,
//         message: 'Bad Request',
//         description: 'Incorrect input'
//       });
//       return;
//     }
//   }
//   if (values.length == 3) {
//     connection.query(sql, values, function (err, rows) {
//       var result = undefined;
//       if (err) {
//         //console.log(err);
//         switch (err.errno) {
//           case 1062:
//             result = {
//               state: 1062,
//               message: err.code,
//               description: '[Error] E-mail already in use.'
//             };
//             //break;
//           case 1048:
//             result = {
//               state: 1048,
//               message: err.code,
//               description: '[Error] Sign up information is incomplete.'
//             };
//             break;
//           default:
//             //throw err;            
//         }
//       } else {

//         if (rows.length != 0) {
//           result = {
//             state: 200,
//             message: 'OK',
//             description: 'Sign Up Successful.',
//             UID: rows.insertId
//           };
//         } else {

//         }
//       }

//       console.log('Result\t:\t' + JSON.stringify(result));
//       res.json(result);
//     });
//   }
// });

// //login
// router.post('/login', function (req, res, next) {
//   var sql = 'SELECT `UID`, `email`, `fullname` FROM `user` WHERE `email`=? AND `password`=?';
//   var email = req.param('email');
//   var password = md5(req.param('password'));
//   var values = [email, password];

//   connection.query(sql, values, function (error, rows, fields) {
//     var result;
//     if (error) {
//       console.log(error);
//       throw error;
//     }
//     if (rows.length != 0) {
//       result = rows[0];
//       req.session.isLogin = true;
//       req.session.user = result;
//       req.session.userID = req.param('email');
//       req.session.UID = result.UID;
//       result = {
//         isLogin: true,
//         uid: result.UID,
//         email: req.param('email')
//       };
//     } else {
//       result = {
//         isLogin: false,
//         uid: undefined,
//         email: undefined
//       };
//     }
//     console.log('Result\t:\t' + JSON.stringify(result));
//     console.log('Session\t:\t' + req.session.id);
//     res.json(result);
//   });
// });

// router.delete('/logout', function (req, res, next) {
//   req.session.destroy();
// });

//getwifi
router.post('/getwifi', function (req, res, next) {
  var result = undefined;
  var lat = parseFloat(req.param('lat'));
  var lng = parseFloat(req.param('lng'));
  var uid = req.param('UID');
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
  var sql = '' +
    'SELECT *, (ROUND( 1000 * 6371 * acos( cos( radians(' + lat + ') ) * cos( radians( `lat` ) ) * cos( radians( `lng` ) - radians(' + lng + ') ) + sin( radians(' + lat + ') ) * sin(radians(`lat`)) ), 2 )) AS `distance` ' +
    'FROM `online` ' +
    where +
    'ORDER BY `distance` ASC';

  if (isLogin(req.session)) {
    connection.query(sql, send, function (err, rows) {
      //console.log(rows);
      var result = {
        hasData: (rows == undefined ? false : true),
        wifi: rows
      };

      console.log('Result\t:\t' + JSON.stringify(result));
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

//origin is '/setwifi'
router.post('/online', function (req, res, next) {
  var lat = parseFloat(req.param('lat'));
  var lng = parseFloat(req.param('lng'));
  var email = req.session.user.email;
  var uid = req.session.user.UID;
  var _wifi = makeWiFiData(uid, email);
  var send = {
    'uid': uid,
    'lat': lat,
    'lng': lng,
    'ssid': _wifi.ssid,
    'password': _wifi.password
  };
  var sql = 'INSERT INTO `online` SET ?';
  console.log('_wifi\t:\t' + _wifi);
  connection.query(sql, send, function (err, rows) {
    var result;
    if (err) {
      console.log(err);
      throw err;
    }
    console.log(rows);
    if (rows.length != 0) {
      result = {
        hasData: true,
        wifi: _wifi
      };
      req.session.isSharing = true;
    } else {
      result = {
        hasData: false,
        wifi: undefined
      };
      req.session.isSharing = false;
    }
    console.log('Result\t:\t' + JSON.stringify(result));
    res.json(result);
  });
});

router.delete('/online', function (req, res, next) {
  console.log('Sharing\t:\t' + req.session.isSharing);
  var uid = req.session.user.UID;
  var sql = 'DELETE FROM `online` WHERE `UID`=?';
  if (req.session.isSharing) {
    connection.query(sql, [uid], function (err, rows) {
      var result;
      if (err) console.log('Error\t:\t' + JSON.stringify(err));
      console.log('Rows\t:\t' + JSON.stringify(rows));
      if (rows.length != 0) {
        result = {
          state: 200,
          message: 'OK',
          description: 'Delete online successful.'
        };
      } else {
        result = {
          state: 500,
          message: 'Internal Error',
          description: 'Delete online error.'
        };
      }
      console.log('Result\t:\t' + JSON.stringify(result));
      res.json(result);
    });
  } else {
    result = {
      state: 500,
      message: 'Internal Error',
      description: 'Delete online error.'
    };
    console.log('Result\t:\t' + JSON.stringify(result));
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
  var uid = req.session.user.UID;
  var sql = 'UPDATE `wifi`.`online` SET `lat`=?, `lng`=?, `online_time`=CURRENT_TIMESTAMP() WHERE `UID`=?';
  var values = [lat, lng, uid];
  var result = {
    state: 400,
    updateState: false
  };

  console.log(JSON.stringify(values));
  for (var i in values) {
    if (values[i] == undefined || values.length != 3) {
      res.json(result);
      break;
    }
  }
  if (req.session.isSharing) {
    connection.query(sql, values, function (err, rows, fields) {
      if (err) throw err;

      if (rows.length != 0) {
        result = {
          state: 200,
          updateState: true
        };
        console.log('Result\t:\t' + JSON.stringify(result));
        res.json(result);
      }
    });
  } else {
    console.log('not in sharing');
    res.json(result);
  }
});

function makeWiFiData(uid, email) {
  var uuid = require('uuid/v4')().toString();
  var _ssid = 'ID' + uid + '_' + email.split('@')[0].toUpperCase();
  var _password = uuid.replace(/-/gi, '');
  return {
    ssid: _ssid,
    password: _password
  };
}

function getDateTime() {
  var result = '';
  var date = new Date();
  result = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
  result += ' - ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
  return result;
}


//function for this routing
function isLogin(session) {
  return session.isLogin == true;
}

module.exports = router;
