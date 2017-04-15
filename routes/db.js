var mysql = require('mysql2');

/* mysql connection and configuration */
function getConnect() {
  var connection = mysql.createConnection({
    host: '163.18.22.94',
    port: 3306,
    user: 'node',
    password: '1qaz2wsx',
    database: 'wifi'
  });

  return connection;
}

module.exports = getConnect();
