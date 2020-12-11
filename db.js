const mysql = require('mysql');

//Database connection
if(process.env.NODE_ENV && process.env.NODE_ENV == 'production')
  process.env.NODE_ENV = 'production';
else
  process.env.NODE_ENV = 'development';

let password = '';
if (process.env.NODE_ENV == 'production')
  password = 'oDvc!37fDSa3';

const db = mysql.createConnection({
  host        : 'localhost',
  user        : 'root',
  password    : password,
  database    : 'pushmio',
  dateStrings : 'date'
});


db.connect((err) => {
  try {
    if (err) throw err;
    console.log('Mysql connected...');
  } catch (err) {
    console.log(err);
  }
});


module.exports = db;
