import { readFileSync } from "node:fs";
import pg from "pg";

const env = readFileSync(".env", "utf8");
const url = (env.match(/^DATABASE_URL="?([^"\r\n]+)"?/m) ?? [])[1] ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not found");

const client = new pg.Client({ connectionString: url });
await client.connect();

const cols = await client.query(
  `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='crop' ORDER BY column_name`
);
const tables = await client.query(
  `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN
   ('crop_milestone_template','crop_task_template','growth_task','crop_cycle') ORDER BY table_name`
);
const migs = await client.query(`SELECT migration_name, finished_at::text FROM "_prisma_migrations" ORDER BY started_at`);

console.log("crop columns:", cols.rows.map((r) => r.column_name).join(", "));
console.log("tables present:", tables.rows.map((r) => r.table_name).join(", "));
console.log("applied migrations:", migs.rows.map((r) => `${r.migration_name} (${r.finished_at})`).join(" | "));

await client.end();