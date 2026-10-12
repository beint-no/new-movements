import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { tmpdir } from "node:os";
import { setTimeout } from "node:timers/promises";

const require = createRequire(import.meta.url);
const wranglerModule = process.env.REAI_WRANGLER_MODULE ?? path.join(execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim(), "wrangler");
const { experimental_readRawConfig } = require(wranglerModule);
const [command, configPath, artifactPath = ".preview"] = process.argv.slice(2);
const configFile = path.resolve(configPath);
const { rawConfig: config } = experimental_readRawConfig({ config: configFile });
const artifact = path.resolve(artifactPath);
const previewName = process.env.REAI_PREVIEW_NAME ?? `review-${process.env.PR_NUMBER}`;
const environment = `${config.name}-${previewName}`;
const marker = `<!-- reai-pr-preview:${config.name} -->`;

async function compiledEntrypoint(name) {
  for (const candidate of new Set([name, `${path.parse(name).name}.js`])) {
    try {
      await access(path.join(artifact, "worker", candidate));
      return candidate;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  throw new Error("Compiled preview entrypoint is missing");
}

function wrangler(args, options = {}) {
  return execFileSync("wrangler", args, { stdio: "inherit", ...options });
}

async function github(route, method = "GET", body) {
  const response = await fetch(`${process.env.GITHUB_API_URL ?? "https://api.github.com"}/repos/${process.env.GITHUB_REPOSITORY}/${route}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`GitHub ${method} ${route}: ${response.status}`);
  return response.status === 204 ? null : response.json();
}

async function comment(body) {
  for (let page = 1; ; page++) {
    const comments = await github(`issues/${process.env.PR_NUMBER}/comments?per_page=100&page=${page}`);
    const existing = comments.find(item => item.user.type === "Bot" && item.body.startsWith(marker));
    if (existing) return github(`issues/comments/${existing.id}`, "PATCH", { body: `${marker}\n${body}` });
    if (comments.length < 100) break;
  }
  return github(`issues/${process.env.PR_NUMBER}/comments`, "POST", { body: `${marker}\n${body}` });
}

async function removePreview() {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(process.env.CLOUDFLARE_ACCOUNT_ID)}/workers/workers/${encodeURIComponent(config.name)}/previews/${previewName}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
  });
  const result = await response.json();
  if (!result.success && !result.errors?.some(error => error.code === 10025)) throw new Error(`Cloudflare preview removal failed: ${response.status}`);
}

async function recordRemoval() {
  for (const deployment of await github(`deployments?environment=${encodeURIComponent(environment)}&per_page=100`)) {
    await github(`deployments/${deployment.id}/statuses`, "POST", { state: "inactive", environment, description: "Pull request closed" });
  }
  await comment(`Preview removed because PR #${process.env.PR_NUMBER} is closed.`);
}

async function recordPreview(url) {
  const deployment = await github("deployments", "POST", { ref: process.env.PR_SHA, environment, auto_merge: false, required_contexts: [], transient_environment: true, production_environment: false, description: `PR #${process.env.PR_NUMBER} preview` });
  await github(`deployments/${deployment.id}/statuses`, "POST", { state: "success", environment, environment_url: url, log_url: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`, auto_inactive: true });
  await comment(`Preview: [${config.name}](${url})\n\nUpdates on every push. Revision: \`${process.env.PR_SHA}\`. Read-only: orders, payments and form submissions are disabled. Removed when this PR closes.`);
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `Preview: [${config.name}](${url})\n`, { flag: "a" });
  console.log(url);
}

if (["deploy", "cleanup"].includes(command) && (config.vars?.REAI_MANAGED_PREVIEWS === "true" || config.previews?.vars?.REAI_MANAGED_PREVIEWS === "true")) {
  const identity = await fetch(process.env.ACTIONS_ID_TOKEN_REQUEST_URL + "&audience=reai-storefront", {
    headers: { Authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` },
  });
  if (!identity.ok) throw new Error("GitHub identity request failed");
  const { value } = await identity.json();
  console.log(`::add-mask::${value}`);
  const apiUrl = (config.previews?.vars?.REAI_PREVIEW_API_BASE_URL ?? config.vars?.REAI_API_BASE_URL ?? "https://app.reai.no").replace(/\/$/, "") + "/online-store/preview/";
  const run = { repositoryId: Number(process.env.GITHUB_REPOSITORY_ID), runId: Number(process.env.GITHUB_RUN_ID),
    attempt: Number(process.env.GITHUB_RUN_ATTEMPT), pullRequest: Number(process.env.PR_NUMBER), sha: process.env.PR_SHA,
    artifactName: process.env.ARTIFACT_NAME };
  async function request(route) {
    const response = await fetch(apiUrl + route, { method: "POST", headers: { Authorization: `Bearer ${value}`, "Content-Type": "application/json" }, body: JSON.stringify(run) });
    if (!response.ok) throw new Error(`Managed preview ${route} failed: ${response.status}`);
    return response.status === 204 ? null : response.json();
  }
  await request("request");
  for (let attempt = 0; ; attempt++) {
    const result = await request("result");
    if (result.ready) {
      if (result.url) await recordPreview(result.url); else await recordRemoval();
      break;
    }
    if (attempt === 59) throw new Error("Managed preview deployment timed out");
    await setTimeout(10000);
  }
  process.exit(0);
}

if (command === "build") {
  await mkdir(artifact, { recursive: true });
  wrangler(["deploy", "--dry-run", "--config", configFile, "--outdir", path.join(artifact, "worker")], { cwd: path.dirname(configFile) });
  if (config.assets) {
    await cp(path.resolve(path.dirname(configFile), config.assets.directory), path.join(artifact, "assets"), { recursive: true });
  }
  await writeFile(path.join(artifact, "entrypoint.json"), JSON.stringify(await compiledEntrypoint(path.basename(config.main))));
} else if (["deploy", "cleanup", "publish", "remove"].includes(command)) {
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(previewName)) throw new Error("Invalid preview name");
  const vars = { ...config.vars, ...config.previews?.vars, CHECKOUT_ENABLED: "false", DEMO_CHECKOUT_ENABLED: "false" };
  // Build hooks, routes and production resource bindings never enter the credentialed job.
  const previewConfig = {
    name: config.name,
    main: "preview-worker.mjs",
    compatibility_date: config.compatibility_date,
    compatibility_flags: config.compatibility_flags,
    workers_dev: true,
    previews: { vars },
    observability: { enabled: true },
    ...(config.assets ? { assets: { ...config.assets, directory: "./assets", run_worker_first: true } } : {}),
  };
  await mkdir(artifact, { recursive: true });
  const deployConfig = path.join(artifact, "preview.json");
  await writeFile(deployConfig, JSON.stringify(previewConfig, null, 2));
  if (["cleanup", "remove"].includes(command)) {
    await removePreview();
    if (command === "cleanup") await recordRemoval();
  } else {
    if (command === "deploy") {
      const pr = await github(`pulls/${process.env.PR_NUMBER}`);
      if (pr.state !== "open" || pr.head.sha !== process.env.PR_SHA) {
        console.log("Skipping a superseded or closed pull request preview");
        process.exit(0);
      }
    }
    let entrypoint = JSON.parse(await readFile(path.join(artifact, "entrypoint.json"), "utf8"));
    if (typeof entrypoint !== "string" || !/^[a-zA-Z0-9_.-]+\.(?:m?js)$/.test(entrypoint)) throw new Error("Invalid preview entrypoint");
    entrypoint = await compiledEntrypoint(entrypoint);
    await writeFile(path.join(artifact, "preview-worker.mjs"), `import worker from "./worker/${entrypoint}";
export default {
  async fetch(request, env, ctx) {
    let response;
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      response = Response.json({ error: "PR previews are read-only. Orders and form submissions are disabled." }, { status: 405 });
    } else {
      response = await worker.fetch(request, env, ctx);
    }
    response = new Response(response.body, response);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
};\n`);
    const args = ["preview", "--config", deployConfig, "--name", previewName, "--ignore-base-config", "--json"];
    let secretsFile;
    if (process.env.REAI_PREVIEW_CREDENTIAL) {
      if (!["REAI_SITE_TOKEN", "REAI_SITE_CREDENTIAL"].includes(process.env.SITE_CREDENTIAL_BINDING)) throw new Error("Invalid Site credential binding");
      secretsFile = path.join(process.env.RUNNER_TEMP ?? tmpdir(), `preview-secrets-${process.pid}.json`);
      await writeFile(secretsFile, JSON.stringify({ [process.env.SITE_CREDENTIAL_BINDING]: process.env.REAI_PREVIEW_CREDENTIAL }), { mode: 0o600 });
      args.push("--secrets-file", secretsFile);
    } else if (process.env.SITE_CREDENTIAL_BINDING) {
      throw new Error("Configure REAI_PREVIEW_CREDENTIAL with a read-only Site credential");
    }
    let output;
    try {
      const stdout = wrangler(args, { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });
      output = JSON.parse(stdout.slice(stdout.lastIndexOf("\n{") + 1));
    } finally {
      if (secretsFile) await rm(secretsFile, { force: true });
    }
    const url = output.preview?.urls?.[0];
    if (typeof url !== "string" || !url.startsWith("https://")) throw new Error("Cloudflare did not return a Preview URL");
    for (let attempt = 0; ; attempt++) {
      try {
        const probe = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10000) });
        if (probe.status < 200 || probe.status >= 400) throw new Error(`Preview returned ${probe.status}`);
        break;
      } catch (error) {
        if (attempt === 5) throw error;
        await setTimeout(2000);
      }
    }
    if (command === "publish") console.log(url); else await recordPreview(url);
  }
} else {
  throw new Error("Usage: preview.mjs build|deploy|cleanup <wrangler-config> <artifact-directory>");
}
