import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildAssets } from './build-assets.mjs';

test('content changes refresh only the affected URL and build the matching fallback pages', async t => {
  const root = await mkdtemp(join(tmpdir(), 'storefront-assets-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'public', 'assets'), { recursive: true });
  await writeFile(join(root, 'public', 'assets', 'store.js'), 'console.log("store");');
  await writeFile(join(root, 'public', 'assets', 'store.css'), 'body{margin:0}');
  for (const file of ['index.html', '404.html']) await writeFile(join(root, 'public', file), '<link rel="stylesheet" href="/assets/store.css">');
  for (const file of ['assets/favicon.svg', 'favicon.ico', 'apple-touch-icon.png']) await writeFile(join(root, 'public', file), 'icon');
  const first = await buildAssets(root);
  assert.deepEqual(await buildAssets(root), first);
  await writeFile(join(root, 'public', 'assets', 'store.css'), 'body{margin:1px}');
  const changed = await buildAssets(root);
  assert.notEqual(changed.STORE_STYLE, first.STORE_STYLE);
  assert.equal(changed.STORE_SCRIPT, first.STORE_SCRIPT);
  assert.equal(await readFile(join(root, 'dist', 'public', 'assets', 'store.css'), 'utf8'), 'body{margin:1px}');
  for (const file of ['index.html', '404.html']) assert((await readFile(join(root, 'dist', 'public', file), 'utf8')).includes(changed.STORE_STYLE));
  await writeFile(join(root, 'public', 'assets', 'store.js'), 'console.log("updated store");');
  assert.notEqual((await buildAssets(root)).STORE_SCRIPT, first.STORE_SCRIPT);
});
