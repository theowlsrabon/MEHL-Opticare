import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("ERROR: DATABASE_URL not found in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const sql = fs.readFileSync(path.join(process.cwd(), 'schema_neon.sql'), 'utf-8');
  console.log("Applying schema_neon.sql to Neon PostgreSQL...");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("SUCCESS: Schema applied successfully to Neon!");
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
    console.log("Tables in public schema:", res.rows.map(r => r.table_name));
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
