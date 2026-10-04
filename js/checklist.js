export const CATEGORIES = ['Travel documents', 'Clothing', 'Electronics', 'Toiletries', 'Other'];
export const STORAGE_KEY = 'readypack.checklist.v1';

export function normalizeItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Each item must be an object.');
  const title = typeof item.title === 'string' ? item.title.trim() : '';
  if (!title || title.length > 80) throw new Error('Use an item name between 1 and 80 characters.');
  if (!CATEGORIES.includes(item.category)) throw new Error('Choose a valid category.');
  const quantity = item.quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('Quantity must be a whole number from 1 to 99.');
  if (typeof item.id !== 'string' || !item.id || item.id.length > 100) throw new Error('Each item needs a valid identifier.');
  if (typeof item.essential !== 'boolean' || typeof item.packed !== 'boolean') throw new Error('Item flags must be true or false.');
  return { id: item.id, title, category: item.category, quantity, essential: item.essential, packed: item.packed };
}

export function decodeChecklist(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('The file must contain valid JSON.'); }
  if (data?.version !== 1 || !Array.isArray(data.items)) throw new Error('Use a ReadyPack version 1 export.');
  if (data.items.length > 500) throw new Error('A checklist can contain at most 500 items.');
  const items = data.items.map(normalizeItem);
  if (new Set(items.map(item => item.id)).size !== items.length) throw new Error('Item identifiers must be unique.');
  return items;
}

export function encodeChecklist(items) {
  return JSON.stringify({ version: 1, items: items.map(normalizeItem) }, null, 2);
}

export function filterItems(items, { query = '', category = 'All', status = 'all', essentialOnly = false } = {}) {
  const needle = query.trim().toLocaleLowerCase();
  return items.filter(item =>
    (!needle || `${item.title} ${item.category}`.toLocaleLowerCase().includes(needle)) &&
    (category === 'All' || item.category === category) &&
    (status === 'all' || (status === 'packed' ? item.packed : !item.packed)) &&
    (!essentialOnly || item.essential)
  );
}

export function summarize(items) {
  const total = items.length;
  const packed = items.filter(item => item.packed).length;
  const essentialRemaining = items.filter(item => item.essential && !item.packed).length;
  return { total, packed, remaining: total - packed, essentialRemaining, percent: total ? Math.round(packed / total * 100) : 0 };
}

export function updateItem(items, id, updates) {
  if (!items.some(item => item.id === id)) throw new Error('Item not found.');
  return items.map(item => item.id === id ? normalizeItem({ ...item, ...updates, id }) : item);
}

export function sampleItems() {
  return [
    { id: 'demo-1', title: 'Travel ID', category: 'Travel documents', quantity: 1, essential: true, packed: true },
    { id: 'demo-2', title: 'Booking confirmation', category: 'Travel documents', quantity: 1, essential: true, packed: false },
    { id: 'demo-3', title: 'Everyday shirts', category: 'Clothing', quantity: 3, essential: false, packed: true },
    { id: 'demo-4', title: 'Comfortable walking shoes', category: 'Clothing', quantity: 1, essential: false, packed: false },
    { id: 'demo-5', title: 'Phone charger', category: 'Electronics', quantity: 1, essential: true, packed: false },
    { id: 'demo-6', title: 'Headphones', category: 'Electronics', quantity: 1, essential: false, packed: true },
    { id: 'demo-7', title: 'Toothbrush', category: 'Toiletries', quantity: 1, essential: false, packed: false },
    { id: 'demo-8', title: 'Reusable water bottle', category: 'Other', quantity: 1, essential: false, packed: false }
  ];
}
