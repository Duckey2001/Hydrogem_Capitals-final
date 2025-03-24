const { Pool } = require('pg');

// PostgreSQL connection configuration
const pool = new Pool({
  user: 'your_db_user', // Replace with your PostgreSQL username
  host: 'localhost',
  database: 'postgres', // Replace with your database name
  password: 'your_db_password', // Replace with your PostgreSQL password
  port: 5432,
});

module.exports = pool;