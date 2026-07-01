const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL connected');
  } catch (error) {
    console.error('❌ PostgreSQL connection error');
    console.error(`   message: ${error.message || 'unknown error'}`);
    if (error.code) console.error(`   code: ${error.code}`);
    if (error.detail) console.error(`   detail: ${error.detail}`);
    if (error.hint) console.error(`   hint: ${error.hint}`);
    process.exit(1);
  }
};

module.exports = { connectDB, pool };


