import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchProducts } from './search.mjs';
const variant = (size) => ({ id: size, price: 100, options: [{ name: 'Size', value: size }] });
const catalog = [
 { title: 'Cloud Boot (Black)', productType: 'Boot', description: 'For winter days.', variants: [variant('40'), variant('43')] },
 { title: 'Zen (White)', productType: 'Sneaker', attributes: [{ key: 'footwear-material', values: [{ label: 'Suède' }] }], variants: [variant('40')] },
 { title: 'Care cream', description: 'For black boots.', variants: [variant('Default')] },
];
test('normal queries combine words across title, type and managed attributes, ranking identity over body copy', () => {
 assert.equal(searchProducts(catalog, 'black boots')[0].title, 'Cloud Boot (Black)');
 assert.equal(searchProducts(catalog, 'winter boots').length, 1);
 assert.equal(searchProducts(catalog, 'white sneakers suede').length, 1);
 assert.equal(searchProducts(catalog, 'white 43').length, 0);
 assert.equal(searchProducts(catalog, 'boot 43')[0].selectedVariantId, '43');
 assert.equal(searchProducts(catalog, 'boots EU 43')[0].selectedVariantId, '43');
 assert.equal(searchProducts(catalog, 'black purple').length, 0);
 assert.equal(searchProducts(catalog, '.*').length, 0);
 assert.equal(searchProducts(catalog, '').length, 0);
 assert.equal(searchProducts(catalog, 'black', 1).length, 1);
 assert.equal(catalog[0].selectedVariantId, undefined);
});
