const mysql = require('mysql');
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '*aksen1090314',
  database: 'parking'
});
conn.connect();
module.exports = conn;