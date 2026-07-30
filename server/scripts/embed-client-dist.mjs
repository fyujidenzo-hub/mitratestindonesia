import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(scriptDirectory, "..");
const clientDist = path.resolve(serverRoot, "../client/dist");
const serverEntry = path.resolve(serverRoot, "dist/src/index.js");
const manifestMarker = "/* __EMBEDDED_CLIENT_ASSETS__ */ {}";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function collectFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const entryPath = path.join(directory, entry);
    return statSync(entryPath).isDirectory() ? collectFiles(entryPath) : [entryPath];
  });
}

if (!existsSync(path.join(clientDist, "index.html"))) {
  throw new Error(`Client build is missing at ${clientDist}. Build the client first.`);
}

if (!existsSync(serverEntry)) {
  throw new Error(`Compiled server entry is missing at ${serverEntry}. Run TypeScript first.`);
}

const assets = {};

for (const filePath of collectFiles(clientDist)) {
  if (path.basename(filePath) === ".htaccess") continue;

  const extension = path.extname(filePath).toLowerCase();
  const relativePath = path.relative(clientDist, filePath).split(path.sep).join("/");
  const publicPath = `/${relativePath}`;

  assets[publicPath] = {
    contentType: contentTypes[extension] || "application/octet-stream",
    content: readFileSync(filePath).toString("base64"),
  };
}

if (assets["/favicon.svg"]) {
  assets["/favicon.ico"] = assets["/favicon.svg"];
}

const compiledSource = readFileSync(serverEntry, "utf8");

if (!compiledSource.includes(manifestMarker)) {
  throw new Error("The embedded-client marker is missing from the compiled server entry.");
}

writeFileSync(
  serverEntry,
  compiledSource.replace(manifestMarker, JSON.stringify(assets)),
  "utf8",
);

console.log(`Embedded ${Object.keys(assets).length} client asset(s) in ${serverEntry}`);
