import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { EDITORIAL_IMAGES } from '../sites/newmovements/editorial-image-manifest.mjs';
import { optimizeEditorialImages } from '../sites/newmovements/editorial-images.mjs';

test('every editorial rendition exists, matches its content hash, and remains tied to its source', async () => {
  const root = new URL('../sites/newmovements/public/', import.meta.url);
  let originals = 0, largest = 0;
  for (const [url, image] of Object.entries(EDITORIAL_IMAGES)) {
    const source = await readFile(new URL(url.slice(1), root));
    assert.equal(createHash('sha256').update(source).digest('hex'), image.sourceHash, `Regenerate changed image: ${url}`);
    originals += source.length;
    let last = 0;
    for (const rendition of image.renditions) {
      assert(rendition.width > last && rendition.width <= image.width);
      last = rendition.width;
      const bytes = await readFile(new URL(rendition.url.slice(1), root));
      assert(rendition.url.endsWith(`.${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}.avif`));
      assert.equal(bytes.subarray(4, 8).toString(), 'ftyp');
      if (rendition === image.renditions.at(-1)) largest += bytes.length;
    }
  }
  assert(largest < originals / 2);
});

test('responsive editorial markup keeps layout, descriptions and priority without changing product images', () => {
  const hero = optimizeEditorialImages('<img class="hero" src="/brand-assets/hero-men.jpg" alt="Shoe outdoors" width="1195" height="1465" fetchpriority="high">');
  assert.match(hero, /src="[^\"]+\.avif"/);
  assert.match(hero, /srcset="[^\"]+ 640w, [^\"]+ 960w, [^\"]+ 1195w"/);
  assert.match(hero, /alt="Shoe outdoors" width="1195" height="1465" fetchpriority="high"/);
  assert.equal((hero.match(/width=/g) || []).length, 1);
  const product = '<img src="https://app.reai.no/media/product/image.avif" alt="Product">';
  assert.equal(optimizeEditorialImages(product), product);
});
