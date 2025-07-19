const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // ✅ Prefer IPv4 to avoid Render IPv6 issues

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.NEON_URL,
  ssl: {
    require: true,             // ✅ Force SSL
    rejectUnauthorized: false  // ✅ Ignore self-signed cert issue
  }
});

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL Database'))
  .catch(err => console.error('❌ Connection error', err));

module.exports = pool;
