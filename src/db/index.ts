import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import type { PoolConfig, Pool as PgPool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: PgPool | undefined;
}

/**
 * Derives the optimal PostgreSQL pool configuration for Faculty360.
 * Priority 1: Supabase PostgreSQL connection string (DATABASE_URL, SUPABASE_DB_URL, or SUPABASE_URL).
 * Priority 2: Standalone or Cloud SQL PostgreSQL configuration (SQL_HOST, SQL_USER, etc.) if provided.
 */
export const getPoolConfig = (): PoolConfig => {
  // 1. Check for Supabase PostgreSQL direct/pooled connection string
  const rawDbUrl =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    (process.env.SUPABASE_URL && process.env.SUPABASE_URL.startsWith('postgres')
      ? process.env.SUPABASE_URL
      : undefined);

  // Ensure connection string doesn't contain unreplaced placeholder
  if (rawDbUrl && !rawDbUrl.includes('[YOUR-PASSWORD]')) {
    return {
      connectionString: rawDbUrl,
      ssl: rawDbUrl.includes('supabase.co') || rawDbUrl.includes('pooler.supabase.com')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      connectionTimeoutMillis: 15000,
    };
  }

  // 2. Fallback to configured PostgreSQL environment variables if available
  if (process.env.SQL_HOST && process.env.SQL_DB_NAME) {
    return {
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    };
  }

  // 3. Fallback placeholder to prevent runtime crashes during unconfigured cold boots
  return {
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
    max: 1,
    connectionTimeoutMillis: 5000,
  };
};

export const createPool = (): PgPool => {
  if (!global._postgresPool) {
    const config = getPoolConfig();
    global._postgresPool = new Pool(config);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();

export const db = drizzle(pool, { schema });

