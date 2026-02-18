import pkg from 'pg';

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.PG_DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Connected to PG database');
});

pool.on('remove', () => {
  console.log('Disconnected from PG database');
});

export default pool;
