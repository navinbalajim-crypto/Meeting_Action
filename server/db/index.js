import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || '';
let pool = null;
let isPgAvailable = false;

// Local Development Fallback Directory
const DB_FALLBACK_DIR = path.resolve('uploads', 'db');
if (!fs.existsSync(DB_FALLBACK_DIR)) {
  fs.mkdirSync(DB_FALLBACK_DIR, { recursive: true });
}

export async function initDb() {
  if (DATABASE_URL && DATABASE_URL.trim().length > 0) {
    try {
      console.log('[Database] Connecting to PostgreSQL / Supabase...');
      pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes('supabase') || process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false
      });

      // Test connection
      const client = await pool.connect();
      console.log('✅ [Database] PostgreSQL connected successfully!');
      
      // Auto-run schema migrations
      const migrationFile = path.resolve('server', 'db', 'migrations', '001_initial_schema.sql');
      if (fs.existsSync(migrationFile)) {
        const ddl = fs.readFileSync(migrationFile, 'utf8');
        await client.query(ddl);
        console.log('✅ [Database] Schema migration 001 verified and applied.');
      }
      client.release();
      isPgAvailable = true;
      return true;
    } catch (err) {
      console.warn('⚠️ [Database] PostgreSQL connection failed:', err.message);
      console.warn('⚠️ [Database] Engaging secure file-backed JSON repository fallback for local development.');
      isPgAvailable = false;
    }
  } else {
    console.log('ℹ️ [Database] DATABASE_URL not set. Running in secure file-backed development fallback mode.');
    isPgAvailable = false;
  }
  return false;
}

export function isPostgresConnected() {
  return isPgAvailable;
}

export async function query(text, params = []) {
  if (isPgAvailable && pool) {
    return await pool.query(text, params);
  }
  throw new Error('Database pool not connected. Use repository layer for storage.');
}

export { pool, DB_FALLBACK_DIR };
export default { initDb, isPostgresConnected, query, pool };
