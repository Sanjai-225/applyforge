import pg from "pg";
import fs from "fs";
import path from "path";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`⏳ Applying ${file}...`);
    await client.query(sql);
    console.log(`✅ Applied ${file}`);
  }

  await client.end();
  console.log("🎉 All migrations applied!");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
