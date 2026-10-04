import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, normalizeItem, decodeChecklist, encodeChecklist, filterItems, summarize, updateItem, sampleItems } from '../js/checklist.js';
const item = (overrides = {}) => ({ id: 'one', title: 'Phone charger', category: 'Electronics', quantity: 1, essential: true, packed: false, ...overrides });

test('sample data starts with consistent progress and essentials', () => {
  assert.deepEqual(summarize(sampleItems()), { total: 8, packed: 3, remaining: 5, essentialRemaining: 2, percent: 38 });
});
test('empty lists have finite zero progress', () => {
  assert.deepEqual(summarize([]), { total: 0, packed: 0, remaining: 0, essentialRemaining: 0, percent: 0 });
});
test('packing all items produces 100 percent and no essentials left', () => {
  const all = sampleItems().map(entry => ({ ...entry, packed: true }));
  assert.equal(summarize(all).percent, 100);
  assert.equal(summarize(all).essentialRemaining, 0);
});
test('search ignores case and surrounding whitespace', () => {
  assert.equal(filterItems(sampleItems(), { query: ' PHONE ' })[0].title, 'Phone charger');
});
test('search also finds category names', () => {
  assert.equal(filterItems(sampleItems(), { query: 'electronics' }).length, 2);
});
test('category, status, and essential filters combine', () => {
  assert.deepEqual(filterItems(sampleItems(), { category: 'Electronics', status: 'unpacked', essentialOnly: true }).map(entry => entry.id), ['demo-5']);
});
test('packed status excludes unpacked entries', () => {
  assert.equal(filterItems(sampleItems(), { status: 'packed' }).length, 3);
});
test('normalization trims names and removes unrelated imported fields', () => {
  assert.deepEqual(normalizeItem(item({ title: '  Charger  ', unexpected: 'discarded' })), item({ title: 'Charger' }));
});
test('empty, whitespace-only, and overlong names are rejected', () => {
  for (const title of ['', '   ', 'x'.repeat(81)]) assert.throws(() => normalizeItem(item({ title })), /item name/);
});
test('all documented categories are accepted', () => {
  for (const category of CATEGORIES) assert.equal(normalizeItem(item({ category })).category, category);
});
test('unknown categories are rejected', () => {
  assert.throws(() => normalizeItem(item({ category: 'Unknown' })), /category/);
});
test('quantity must be numeric, whole, and within limits', () => {
  for (const quantity of [0, -1, 100, 1.5, NaN, Infinity, true, '1', null]) assert.throws(() => normalizeItem(item({ quantity })), /Quantity/);
  assert.equal(normalizeItem(item({ quantity: 99 })).quantity, 99);
});
test('flags must be booleans', () => {
  assert.throws(() => normalizeItem(item({ packed: 'false' })), /flags/);
});
test('exports import without losing data', () => {
  assert.deepEqual(decodeChecklist(encodeChecklist(sampleItems())), sampleItems());
});
test('malformed JSON and wrong schemas fail with readable errors', () => {
  for (const value of ['{', 'null', '{}', '{"version":2,"items":[]}']) assert.throws(() => decodeChecklist(value));
});
test('duplicate identifiers are rejected', () => {
  assert.throws(() => decodeChecklist(JSON.stringify({ version: 1, items: [item(), item()] })), /unique/);
});
test('checklists above 500 entries are rejected', () => {
  assert.throws(() => decodeChecklist(JSON.stringify({ version: 1, items: Array.from({ length: 501 }, (_, i) => item({ id: String(i) })) })), /500/);
});
test('edits preserve packed state and stable ID without mutating originals', () => {
  const original = [item({ packed: true })];
  const changed = updateItem(original, 'one', { title: 'Cable', id: 'different' });
  assert.equal(changed[0].id, 'one');
  assert.equal(changed[0].packed, true);
  assert.equal(changed[0].title, 'Cable');
  assert.equal(original[0].title, 'Phone charger');
});
test('updates to unknown IDs are rejected', () => {
  assert.throws(() => updateItem([], 'missing', { title: 'Cable' }), /not found/);
});
test('HTML-looking names remain plain strings', () => {
  const title = '<img src=x onerror=alert(1)>';
  assert.equal(decodeChecklist(encodeChecklist([item({ title })]))[0].title, title);
});
