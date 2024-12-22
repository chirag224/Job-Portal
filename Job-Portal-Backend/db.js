const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost', 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'chirag@20xx', 
  database: process.env.DB_NAME || 'jobsdb'
});

db.connect((err) => {
  if (err) {
    console.error(`Error connecting to MySQL: ${err}`);
    return;
  }
  console.log('Connected to MySQL');
});

module.exports = db;
