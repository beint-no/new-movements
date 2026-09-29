#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoots = [
  path.join(repositoryRoot, "packages/reai-cloudflare-storefront"),
  path.join(repositoryRoot, "sites"),
];
const failures = [];

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["node_modules", "public", ".wrangler"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(target));
    else if (/\.(?:js|mjs)$/.test(entry.name) && !/\.(?:test|type-test)\.mjs$/.test(entry.name)) files.push(target);
  }
  return files;
}

for (const sourceRoot of sourceRoots) {
  for (const file of await sourceFiles(sourceRoot)) {
    const source = await readFile(file, "utf8");
    if (source.includes("/site/v1/")) failures.push(path.relative(repositoryRoot, file));
  }
}

const sharedWorker = await readFile(
  path.join(repositoryRoot, "packages/reai-cloudflare-storefront/worker.mjs"),
  "utf8",
);
if (!sharedWorker.includes('../reai-site-client/client.mjs')) {
  failures.push("packages/reai-cloudflare-storefront/worker.mjs does not use @reai/site-client");
}

if (failures.length) {
  throw new Error(`Site API calls must go through the generated client:\n${failures.join("\n")}`);
}

console.log("All storefront Site API calls use the generated client boundary.");
