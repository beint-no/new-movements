import test from 'node:test';
import assert from 'node:assert/strict';
import { composeProductView } from './merchandising.mjs';

const images = ['loafer-side.avif', 'loafer-women-close.avif', 'loafer-men-close.avif', 'loafer-womenmen.avif'].map(filename => ({ url: `https://example.com/images/${filename}`, width: 1000, height: 1000 }));
const product = { id: 'same-product', images, variants: [
  { id: 'shared-40', options: [{ name: 'Size', value: '40' }] },
  { id: 'women-36', options: [{ name: 'Size', value: '36' }] },
  { id: 'men-46', options: [{ name: 'Size', value: '46' }] },
] };

test('overlapping views keep the original product and variant identities without mutating the catalog', () => {
  const original = structuredClone(product);
  const women = composeProductView(product, { option: 'size', values: ['36', '40'], imageTokens: ['women'], excludedImageTokens: ['men'] });
  const men = composeProductView(product, { option: 'size', values: ['40', '46'], imageTokens: ['men'], excludedImageTokens: ['women'] });
  assert.equal(women.id, men.id);
  assert.equal(women.variants.find(v => v.id === 'shared-40'), men.variants.find(v => v.id === 'shared-40'));
  assert.deepEqual(women.variants.map(v => v.id), ['shared-40', 'women-36']);
  assert.deepEqual(men.variants.map(v => v.id), ['shared-40', 'men-46']);
  assert.deepEqual(product, original);
});

test('image markers match complete filename tokens and preserve API metadata and neutral shots', () => {
  const result = composeProductView(product, { option: 'Size', values: ['40'], imageTokens: ['women'], excludedImageTokens: ['men'], neutralImageTokens: ['side'] });
  assert.deepEqual(result.images, [images[1], images[0]]);
  assert.equal(result.images[0], images[1]);
});

test('products outside the selected sizes disappear and unmarked products retain neutral photography', () => {
  assert.equal(composeProductView(product, { option: 'Size', values: ['50'] }), null);
  const result = composeProductView({ ...product, images: [images[0]] }, { option: 'Size', values: ['40'], imageTokens: ['women'], neutralImageTokens: ['side'] });
  assert.deepEqual(result.images, [images[0]]);
});
