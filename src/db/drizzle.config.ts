import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const rawDbUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  (process.env.SUPABASE_URL && process.env.SUPABASE_URL.startsWith("postgres")
    ? process.env.SUPABASE_URL
    : undefined);

const hasValidDbUrl = rawDbUrl && !rawDbUrl.includes("[YOUR-PASSWORD]");

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

const dbCredentials = hasValidDbUrl
  ? {
      url: rawDbUrl!,
      ssl: rawDbUrl!.includes("supabase.co") || rawDbUrl!.includes("pooler.supabase.com"),
    }
  : {
      host: sqlHost || "localhost",
      user: user || "postgres",
      password: password || "",
      database: sqlDbName || "postgres",
      ssl: false,
    };

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials,
  verbose: true,
});
