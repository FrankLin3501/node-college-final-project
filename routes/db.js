var mysql = require('mysql2');
var config = {
  connectionLimit: 1024,
  host: '163.18.22.94',
  port: 3306,
  user: 'node',
  password: '1qaz2wsx',
  database: 'wifi'
};

/* mysql connection and configuration */
function getConnect() {
  var connection = mysql.createPool(config);
  return connection;
}

module.exports = getConnect();
