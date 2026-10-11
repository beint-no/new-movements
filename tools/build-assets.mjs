import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function buildAssets(siteRoot) {
  const source = join(siteRoot, 'public');
  const output = join(siteRoot, 'dist');
  await mkdir(output, { recursive: true });
  await rm(join(output, 'public'), { recursive: true, force: true });
  await cp(source, join(output, 'public'), { recursive: true });
  const urls = {};
  for (const [key, file] of [['STORE_SCRIPT', 'store.js'], ['STORE_STYLE', 'store.css']]) {
    const bytes = await readFile(join(output, 'public', 'assets', file));
    urls[key] = `/assets/${file}?v=${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}`;
  }
  for (const file of ['index.html', '404.html']) {
    const html = await readFile(join(output, 'public', file), 'utf8');
    await writeFile(join(output, 'public', file), html.replaceAll('/assets/store.css', urls.STORE_STYLE));
  }
  const manifest = Object.entries(urls).map(([key, url]) => `export const ${key} = ${JSON.stringify(url)};`).join('\n') + '\n';
  const manifestPath = join(output, 'assets.mjs');
  if (await readFile(manifestPath, 'utf8').catch(() => '') !== manifest) await writeFile(manifestPath, manifest);
  return urls;
}

if (import.meta.main) {
  await buildAssets(fileURLToPath(new URL('../sites/newmovements', import.meta.url)));
}
