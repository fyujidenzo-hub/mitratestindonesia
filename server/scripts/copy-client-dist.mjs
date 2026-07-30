import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(scriptDirectory, "..");
const source = path.resolve(serverRoot, "../client/dist");
// Keep the SPA inside the entry file's directory. Hostinger packages
// `server/dist/src` for the Node runtime and may omit sibling directories.
const destination = path.resolve(serverRoot, "dist/src/client");
const sourceIndex = path.join(source, "index.html");

if (!existsSync(sourceIndex)) {
  throw new Error(`Client build is missing at ${sourceIndex}. Build the client before the server.`);
}

rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true });

console.log(`Copied client build to ${destination}`);
