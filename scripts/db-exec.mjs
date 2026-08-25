/**
 * DB runner — koneksi Postgres Supabase + eksekusi file SQL berurutan.
 * Usage:
 *   DB_PASSWORD='...' node scripts/db-exec.mjs push            # semua migration belum diterapkan
 *   DB_PASSWORD='...' node scripts/db-exec.mjs run <file.sql>  # eksekusi satu file (mis. rls_test)
 */
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [
      l.slice(0, l.indexOf("=")).trim(),
      l.slice(l.indexOf("=") + 1).trim(),
    ]),
);

const ref = env.NEXT_PUBLIC_SUPABASE_URL.match(
  /https:\/\/([a-z0-9]+)\.supabase\.co/,
)?.[1];
if (!ref) throw new Error("NEXT_PUBLIC_SUPABASE_URL tidak valid");
const passwords = [process.env.DB_PASSWORD].filter(Boolean);

const candidates = [
  {
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: "postgres",
    database: "postgres",
  },
  {
    host: `aws-0-ap-southeast-1.pooler.supabase.com`,
    port: 5432,
    user: `postgres.${ref}`,
    database: "postgres",
  },
  {
    host: `aws-0-ap-southeast-2.pooler.supabase.com`,
    port: 5432,
    user: `postgres.${ref}`,
    database: "postgres",
  },
  {
    host: `aws-0-us-east-1.pooler.supabase.com`,
    port: 5432,
    user: `postgres.${ref}`,
    database: "postgres",
  },
];

async function connect() {
  const errors = [];
  for (const pw of passwords) {
    for (const cfg of candidates) {
      try {
        const client = new pg.Client({
          ...cfg,
          password: pw,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 8000,
        });
        await client.connect();
        console.log(`connected: ${cfg.user}@${cfg.host}:${cfg.port}`);
        return client;
      } catch (e) {
        errors.push(`${cfg.host}: ${e.message.slice(0, 90)}`);
      }
    }
  }
  throw new Error("semua kombinasi koneksi gagal:\n" + errors.join("\n"));
}

const client = await connect();

async function execFile(file) {
  const sql = readFileSync(file, "utf8");
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("COMMIT");
    console.log(`OK  ${file}`);
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`FAIL ${file}\n  ${e.message.split("\n")[0]}`);
    return false;
  }
}

const [, , mode, arg] = process.argv;

if (mode === "push") {
  // Tabel jejak migrasi sendiri (idempotent re-run)
  await client.query(
    `create table if not exists public._codpo_migrations (
       filename text primary key, applied_at timestamptz not null default now())`,
  );
  const files = readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort();
  let fail = 0;
  for (const f of files) {
    const { rows } = await client.query(
      "select 1 from public._codpo_migrations where filename = $1",
      [f],
    );
    if (rows.length) {
      console.log(`skip ${f} (sudah)`);
      continue;
    }
    if (!(await execFile(`supabase/migrations/${f}`))) {
      fail++;
      break;
    }
    await client.query(
      "insert into public._codpo_migrations(filename) values ($1)",
      [f],
    );
  }
  process.exit(fail ? 1 : 0);
} else if (mode === "run" && arg) {
  const okFlag = await execFile(arg);
  process.exit(okFlag ? 0 : 1);
} else {
  console.log("mode tidak dikenal");
  process.exit(1);
}
