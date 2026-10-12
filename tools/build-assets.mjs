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
  for (const [key, file] of [['CHECKOUT_SCRIPT', 'assets/checkout.js'], ['CHECKOUT_STYLE', 'assets/checkout.css'], ['STORE_SCRIPT', 'assets/store.js'], ['STORE_STYLE', 'assets/store.css'], ['FAVICON_SVG', 'assets/favicon.svg'], ['FAVICON_ICO', 'favicon.ico'], ['TOUCH_ICON', 'apple-touch-icon.png']]) {
    const bytes = await readFile(join(output, 'public', file));
    urls[key] = `/${file}?v=${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}`;
  }
  for (const file of ['index.html', '404.html']) {
    const html = await readFile(join(output, 'public', file), 'utf8');
    await writeFile(join(output, 'public', file), html.replaceAll('/assets/store.css', urls.STORE_STYLE).replaceAll('/assets/favicon.svg', urls.FAVICON_SVG).replaceAll('/favicon.ico', urls.FAVICON_ICO).replaceAll('/apple-touch-icon.png', urls.TOUCH_ICON));
  }
  const manifest = Object.entries(urls).map(([key, url]) => `export const ${key} = ${JSON.stringify(url)};`).join('\n') + '\n';
  const manifestPath = join(output, 'assets.mjs');
  if (await readFile(manifestPath, 'utf8').catch(() => '') !== manifest) await writeFile(manifestPath, manifest);
  return urls;
}

if (import.meta.main) {
  await buildAssets(fileURLToPath(new URL('../sites/newmovements', import.meta.url)));
}
