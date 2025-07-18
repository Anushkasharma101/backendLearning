const dns = require('dns');
const { Pool } = require('pg');
require('dotenv').config();

async function createPool() {
  const databaseUrl = process.env.DATABASE_URL;

  // Extract host from DATABASE_URL
  const match = databaseUrl.match(/@([^:/]+):(\d+)\//);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  const host = match[1];
  const port = match[2];

  // Resolve IPv4 for Supabase host
  const { address } = await dns.promises.lookup(host, { family: 4 });
  console.log(`✅ Using IPv4 address for DB: ${address}`);

  // Replace host with IPv4 in connection string
  const ipv4ConnectionString = databaseUrl.replace(host, address);

  const pool = new Pool({
    connectionString: ipv4ConnectionString,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    await pool.connect();
    console.log('✅ Connected to PostgreSQL Database via IPv4');
  } catch (err) {
    console.error('❌ Connection error', err);
  }

  return pool;
}

module.exports = createPool();
