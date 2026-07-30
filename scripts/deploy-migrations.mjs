import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function ensurePrismaEnginesAreExecutable() {
  if (process.platform === "win32") return;

  const engineDirectories = [
    join(repositoryRoot, "node_modules", "@prisma", "engines"),
    join(repositoryRoot, "node_modules", ".prisma", "client"),
  ];

  let repairedEngineCount = 0;

  for (const directory of engineDirectories) {
    if (!existsSync(directory)) continue;

    for (const fileName of readdirSync(directory)) {
      if (!/^(schema-engine|query-engine)/.test(fileName)) continue;

      const enginePath = join(directory, fileName);
      if (!statSync(enginePath).isFile()) continue;

      // Some managed hosts extract Prisma's native binaries without their
      // executable bit. Prisma then fails with `spawn ... EACCES`.
      chmodSync(enginePath, 0o755);
      repairedEngineCount += 1;
    }
  }

  if (repairedEngineCount > 0) {
    console.log(`Ensured ${repairedEngineCount} Prisma engine file(s) are executable.`);
  }
}

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

try {
  ensurePrismaEnginesAreExecutable();
} catch (error) {
  console.error("Unable to prepare Prisma's native engines for this host.", error);
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
