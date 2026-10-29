import { execFileSync } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { experimental_readRawConfig } from "wrangler";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configFile = path.join(root, "sites/newmovements/wrangler.jsonc");
const { rawConfig } = experimental_readRawConfig({ config: configFile });
const output = path.join(root, ".production");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
execFileSync(process.execPath, [path.join(root, "node_modules/wrangler/bin/wrangler.js"),
  "deploy", "--dry-run", "--config", configFile, "--outdir", path.join(output, "worker")],
{ cwd: path.dirname(configFile), stdio: "inherit" });
await cp(path.resolve(path.dirname(configFile), rawConfig.assets.directory), path.join(output, "assets"), { recursive: true });

// Deployment consumes the compiled bundle without running repository build hooks with credentials.
const configuration = Object.fromEntries([
  "name", "account_id", "compatibility_date", "compatibility_flags", "workers_dev",
  "routes", "vars", "ratelimits", "observability", "limits",
].filter(key => rawConfig[key] !== undefined).map(key => [key, rawConfig[key]]));
await writeFile(path.join(output, "wrangler.json"), JSON.stringify({
  ...configuration,
  main: `./worker/${path.basename(rawConfig.main)}`,
  no_bundle: true,
  assets: { ...rawConfig.assets, directory: "./assets" },
}, null, 2) + "\n");
