const { Pool } = require('pg');
require('dotenv').config();
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL Database'))
  .catch(err => console.error('❌ Connection error', err.stack));

module.exports = pool;
