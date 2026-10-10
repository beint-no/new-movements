import assert from 'node:assert/strict';
import test from 'node:test';
import { filterCollection, parseCollectionFilters } from './filtering.mjs';

const definitions = [
  { key: 'size', label: 'Size', parameter: 'filter.v.option.size', kind: 'option', optionName: 'Size' },
  { key: 'stock', label: 'Availability', parameter: 'filter.v.availability', kind: 'availability' },
  { key: 'color', label: 'Color', parameter: 'filter.v.t.shopify.color-pattern', kind: 'attribute', attributeKey: 'color' },
  { key: 'features', label: 'Features', parameter: 'filter.v.t.shopify.shoe-features', kind: 'attribute', attributeKey: 'shoe-features' },
];
const attribute = (key, id, name, aliases = []) => ({ key, name: key, values: [{ id: `entry-${id}`, label: `Merchant ${name}`, taxonomyValues: [{ id, name }], aliases }] });
const variant = (id, size, price, attributes = []) => ({ id, price, options: [{ name: 'Size', value: size }], attributes });
const products = [
  { id: 'a', title: 'Alpha', attributes: [attribute('shoe-features', 'waterproof', 'Waterproof', ['metaobject-waterproof'])], variants: [variant('a35', '35', 100, [attribute('color', 'white', 'White')]), variant('a40', '40', 200, [attribute('color', 'black', 'Black')])] },
  { id: 'b', title: 'Beta', attributes: [attribute('shoe-features', 'breathable', 'Breathable')], variants: [variant('b40', '40', 150, [attribute('color', 'white', 'White')]), variant('b405', '40.5', 150, [attribute('color', 'white', 'White')])] },
];
const stock = { a35: false, a40: true, b40: true, b405: false };
const run = (query, availability = stock, catalog = products) => filterCollection(catalog, definitions, parseCollectionFilters(new URLSearchParams(query), definitions), availability);

test('size, stock, price and linked attributes must match the same variant', () => {
  assert.equal(run('filter.v.option.size=35&filter.v.availability=1').products.length, 0);
  assert.equal(run('filter.v.option.size=40&filter.v.price.lte=120').products.length, 0);
  assert.equal(run('filter.v.option.size=40&filter.v.t.shopify.color-pattern=white&filter.v.t.shopify.shoe-features=waterproof').products.length, 0);
  assert.deepEqual(run('filter.v.option.size=40&filter.v.availability=1&filter.v.t.shopify.color-pattern=black').products[0].variants.map(v => v.id), ['a40']);
});

test('values are OR within a facet, facets AND, with half sizes preserved', () => {
  const result = run('filter.v.option.size=35&filter.v.option.size=40.5&filter.v.t.shopify.shoe-features=waterproof,breathable');
  assert.deepEqual(result.products.map(p => p.id), ['a', 'b']);
  assert.deepEqual(result.products.flatMap(p => p.variants.map(v => v.id)), ['a35', 'b405']);
});

test('canonical identities and imported aliases survive merchant renaming', () => {
  assert.deepEqual(run('filter.v.t.shopify.shoe-features=metaobject-waterproof').products.map(p => p.id), ['a']);
  const renamed = structuredClone(products);
  renamed[0].attributes[0].values[0].label = 'Completely new merchant label';
  assert.equal(run('filter.v.t.shopify.shoe-features=waterproof', stock, renamed).products[0].id, 'a');
});

test('facet counts omit their own selections and count distinct products', () => {
  const result = run('filter.v.option.size=40&filter.v.t.shopify.color-pattern=white');
  assert.deepEqual(result.products.map(p => p.id), ['b']);
  const color = result.facets.find(f => f.key === 'color');
  assert.equal(color.values.find(v => v.id === 'black').count, 1);
  assert.equal(color.values.find(v => v.id === 'white').count, 1);
  assert.equal(run('').facets.find(f => f.key === 'color').values.find(v => v.id === 'white').count, 2);
});

test('unknown selections and invalid filters never silently show the unfiltered catalog', () => {
  const result = run('filter.v.t.shopify.shoe-features=missing');
  assert.equal(result.products.length, 0);
  assert.equal(result.facets.find(f => f.key === 'features').values.find(v => v.id === 'missing').selected, true);
  assert.equal(run('filter.p.unknown=value').products.length, 0);
  assert.equal(run('filter.v.price.lte=oops').warnings.length, 1);
  assert.equal(run('filter.v.price.lte=0').products.length, 0);
});

test('unknown stock is never presented as available or out of stock', () => {
  assert.equal(run('filter.v.availability=1', {}).products.length, 0);
  assert.equal(run('filter.v.availability=0', {}).products.length, 0);
  assert.equal(run('filter.v.availability=1', {}).warnings.length, 1);
  assert.equal(run('', {}).facets.find(f => f.key === 'stock').values[0].count, null);
});

test('filtering and sorting leave the input snapshot intact', () => {
  const before = structuredClone(products);
  assert.deepEqual(run('sort_by=price-descending&filter.v.option.size=40').products.map(p => p.id), ['a', 'b']);
  assert.deepEqual(products, before);
  assert.equal(run('sort_by=manual&sort_by=title-descending').products[0].id, 'b');
});
