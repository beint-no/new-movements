import { access, mkdir, readFile, realpath } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sites = JSON.parse(await readFile(path.join(root, "tools/worker-sites.json"), "utf8"));
const [command, ...arguments_] = process.argv.slice(2);
const dryRun = arguments_.includes("--dry-run");
const values = arguments_.filter(value => value !== "--dry-run");
const [preview, requestedSite] = command === "deploy" ? [null, values[0]] : values;
const site = requestedSite ? sites.find(site => site.id === requestedSite) : sites.length === 1 ? sites[0] : null;

if (!["deploy", "preview", "remove"].includes(command) || !site || values.length > (command === "deploy" ? 1 : 2)) {
  throw new Error(`Usage: deploy [site] | preview <name> [site] | remove <name> [site], optionally --dry-run. Sites: ${sites.map(site => site.id).join(", ")}`);
}
if (command !== "deploy" && !/^[a-z0-9][a-z0-9-]{0,11}$/.test(preview ?? "")) {
  throw new Error("Choose a preview name with 1–12 lowercase letters, digits or hyphens.");
}

let module;
for (const directory of process.env.PATH.split(path.delimiter)) {
  try {
    const binary = await realpath(path.join(directory, process.platform === "win32" ? "wrangler.cmd" : "wrangler"));
    module = createRequire(import.meta.url).resolve("wrangler", { paths: [path.dirname(binary)] });
    break;
  } catch (error) {
    if (!["ENOENT", "MODULE_NOT_FOUND"].includes(error.code)) throw error;
  }
}
if (!module) throw new Error("Run this command through the repository npm script to load pinned Wrangler.");
const require = createRequire(import.meta.url);
const { experimental_readRawConfig } = require(module);
const configFile = path.resolve(root, site.config);
const { rawConfig: config } = experimental_readRawConfig({ config: configFile });
const env = { ...process.env, REAI_WRANGLER_MODULE: module, WRANGLER_SEND_METRICS: "false" };
const run = (file, args, cwd = root) => execFileSync(file, args, { cwd, env, stdio: "inherit" });

if (command === "deploy") {
  for (const check of site.checks) run("npm", ["run", check]);
  run("wrangler", ["deploy", "--config", configFile, ...(dryRun ? ["--dry-run"] : [])], path.dirname(configFile));
} else {
  env.CLOUDFLARE_ACCOUNT_ID ||= config.account_id;
  env.REAI_PREVIEW_NAME = `local-${preview}`;
  if (command === "remove") {
    if (dryRun) console.log(`Would remove ${env.REAI_PREVIEW_NAME} from ${config.name}`);
    else run("wrangler", ["preview", "delete", "--config", configFile, "--worker-name", config.name, "--name", env.REAI_PREVIEW_NAME, "--skip-confirmation"]);
  } else {
    env.SITE_CREDENTIAL_BINDING = site.credentialBinding;
    if (!site.credentialBinding) env.REAI_PREVIEW_CREDENTIAL = "";
    if (!dryRun) {
      if (!env.CLOUDFLARE_ACCOUNT_ID) throw new Error("Set CLOUDFLARE_ACCOUNT_ID to the Worker's account.");
      if (site.credentialBinding) {
        const credential = env.REAI_PREVIEW_CREDENTIAL || (env.REAI_PREVIEW_CREDENTIAL_FILE ? (await readFile(env.REAI_PREVIEW_CREDENTIAL_FILE, "utf8")).trim() : "");
        if (!/^site_preview_[A-Za-z0-9_-]{40,}$/.test(credential)) {
          throw new Error("Set REAI_PREVIEW_CREDENTIAL_FILE to a read-only PREVIEW Site credential outside Git, or supply REAI_PREVIEW_CREDENTIAL.");
        }
        env.REAI_PREVIEW_CREDENTIAL = credential;
        env.SITE_CREDENTIAL_BINDING = site.credentialBinding;
      }
    }
    for (const check of site.checks) run("npm", ["run", check]);
    const artifact = path.join(root, ".preview", `${env.REAI_PREVIEW_NAME}-${site.id}`);
    await mkdir(artifact, { recursive: true });
    const helper = path.join(root, ".github/preview/preview.mjs");
    await access(helper);
    run(process.execPath, [helper, "build", configFile, artifact]);
    if (dryRun) console.log(`Preview bundle ready: ${artifact}`);
    else run(process.execPath, [helper, "publish", configFile, artifact]);
  }
}
