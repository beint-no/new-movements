#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  documentUrl,
  generateSiteApiTypes,
  generatedTypesUrl,
  readSiteOpenApi,
} from "./site-openapi.mjs";

const generatedTypes = await generateSiteApiTypes(await readSiteOpenApi());
await mkdir(dirname(fileURLToPath(generatedTypesUrl)), { recursive: true });
await writeFile(generatedTypesUrl, generatedTypes);
console.log(`Generated ReAI Site API declarations from ${documentUrl}.`);
