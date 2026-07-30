import { spawnSync } from "node:child_process";

const isProduction = process.env.NODE_ENV === "production";
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasDirectUrl = Boolean(process.env.DIRECT_URL?.trim());

if (!isProduction) {
  console.log("Skipping production migrations outside NODE_ENV=production.");
  process.exit(0);
}

if (!hasDatabaseUrl || !hasDirectUrl) {
  console.error(
    "Production deployment requires DATABASE_URL and DIRECT_URL before Prisma migrations can run.",
  );
  process.exit(1);
}

const npmCli = process.env.npm_execpath?.trim();
const migration = npmCli
  ? spawnSync(process.execPath, [npmCli, "run", "db:deploy"], {
      stdio: "inherit",
      env: process.env,
    })
  : spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "db:deploy"], {
      stdio: "inherit",
      env: process.env,
    });

if (migration.error) throw migration.error;
if (migration.status !== 0) process.exit(migration.status ?? 1);
