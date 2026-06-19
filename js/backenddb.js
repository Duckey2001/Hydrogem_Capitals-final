const { Pool } = require('pg');

// PostgreSQL connection configuration.
// Credentials are read from environment variables so no secrets live in source.
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user: process.env.PG_USER,
        host: process.env.PG_HOST || 'localhost',
        database: process.env.PG_DATABASE,
        password: process.env.PG_PASSWORD,
        port: parseInt(process.env.PG_PORT, 10) || 5432,
      }
);

module.exports = pool;
