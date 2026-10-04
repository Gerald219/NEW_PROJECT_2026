import { CATEGORIES, STORAGE_KEY, normalizeItem, decodeChecklist, encodeChecklist, filterItems, summarize, updateItem, sampleItems } from './checklist.js';

const $ = selector => document.querySelector(selector);
let items = sampleItems();
let category = 'All';
let editingId = null;
let deleted = null;

function storageWarning(message) {
  $('#storage-warning').textContent = message;
  $('#storage-warning').hidden = false;
}

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) items = decodeChecklist(saved);
} catch {
  storageWarning('Saved data could not be loaded. Showing the sample list; use Export to keep a copy of your changes.');
}

function notify(message, canUndo = false) {
  $('#notice-text').textContent = message;
  $('#undo').hidden = !canUndo;
  $('#notice').hidden = false;
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, encodeChecklist(items)); }
  catch { storageWarning('Browser storage is unavailable or full. Changes work for this visit; use Export to keep a copy.'); }
  render();
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function render() {
  const summary = summarize(items);
  $('#percent').textContent = `${summary.percent}%`;
  $('#progress').value = summary.percent;
  $('#progress-caption').textContent = `${summary.packed} of ${summary.total} items packed`;
  $('#packed-count').textContent = summary.packed;
  $('#remaining-count').textContent = summary.remaining;
  $('#essential-count').textContent = summary.essentialRemaining;
  $('#categories').replaceChildren();
  for (const name of ['All', ...CATEGORIES]) {
    const button = element('button', `category-button${name === category ? ' active' : ''}`);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(name === category));
    button.append(element('span', '', name === 'All' ? 'All items' : name), element('span', 'category-count', name === 'All' ? items.length : items.filter(item => item.category === name).length));
    button.addEventListener('click', () => { category = name; render(); });
    $('#categories').append(button);
  }
  const visible = filterItems(items, { query: $('#search').value, category, status: $('#status').value, essentialOnly: $('#essential-only').checked });
  $('#item-count').textContent = `${visible.length} shown · ${items.length} items in your checklist`;
  $('#list-heading').textContent = category === 'All' ? 'Everything you need' : category;
  $('#items').replaceChildren();
  for (const item of visible) {
    const row = element('li', `item${item.packed ? ' packed' : ''}`);
    row.dataset.id = item.id;
    const label = element('label', 'item-main');
    const checkbox = element('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.packed;
    checkbox.setAttribute('aria-label', `Packed: ${item.title}`);
    checkbox.addEventListener('change', () => {
      items = updateItem(items, item.id, { packed: checkbox.checked });
      const wasPacked = checkbox.checked;
      save();
      const nextCheckbox = Array.from($('#items').querySelectorAll('li')).find(node => node.dataset.id === item.id)?.querySelector('input');
      (nextCheckbox || $('#status')).focus();
      notify(`${item.title} marked ${wasPacked ? 'packed' : 'to pack'}.`);
    });
    const text = element('span', 'item-copy');
    const titleLine = element('span', 'item-title-line');
    titleLine.append(element('span', 'item-title', item.title));
    if (item.essential) titleLine.append(element('span', 'essential-badge', 'ESSENTIAL'));
    text.append(titleLine, element('span', 'item-category', item.category));
    label.append(checkbox, text);
    const quantity = element('span', 'quantity', `×${item.quantity}`);
    quantity.setAttribute('aria-label', `Quantity: ${item.quantity}`);
    const actions = element('div', 'item-actions');
    const edit = element('button', 'text-button', 'Edit');
    edit.type = 'button';
    edit.setAttribute('aria-label', `Edit ${item.title}`);
    edit.addEventListener('click', () => openForm(item));
    const remove = element('button', 'delete-button', '×');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Delete ${item.title}`);
    remove.addEventListener('click', () => {
      deleted = { item, index: items.findIndex(entry => entry.id === item.id) };
      items = items.filter(entry => entry.id !== item.id);
      save();
      $('#undo').hidden = false;
      notify(`${item.title} removed.`, true);
      $('#undo').focus();
    });
    actions.append(edit, remove);
    row.append(label, quantity, actions);
    $('#items').append(row);
  }
  $('#empty-state').hidden = visible.length !== 0;
  $('#empty-description').textContent = items.length ? 'Try a different filter or add an item.' : 'Your checklist is empty. Add your first item to get started.';
}

for (const name of CATEGORIES) {
  const option = element('option', '', name);
  option.value = name;
  $('#item-category').append(option);
}

function openForm(item = null) {
  editingId = item?.id || null;
  $('#item-form').reset();
  $('#form-error').hidden = true;
  $('#dialog-title').textContent = item ? 'Edit packing item' : 'Add a packing item';
  $('#item-title').value = item?.title || '';
  $('#item-category').value = item?.category || (category === 'All' ? CATEGORIES[0] : category);
  $('#item-quantity').value = item?.quantity || 1;
  $('#item-essential').checked = item?.essential || false;
  $('#item-dialog').showModal();
  $('#item-title').focus();
}

$('#add-item').addEventListener('click', () => openForm());
for (const selector of ['#cancel', '#cancel-icon']) $(selector).addEventListener('click', () => $('#item-dialog').close());
$('#item-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    if (!editingId && items.length >= 500) throw new Error('A checklist can contain at most 500 items.');
    const item = normalizeItem({ id: editingId || crypto.randomUUID(), title: $('#item-title').value, category: $('#item-category').value, quantity: $('#item-quantity').valueAsNumber, essential: $('#item-essential').checked, packed: items.find(item => item.id === editingId)?.packed || false });
    items = editingId ? updateItem(items, editingId, item) : [...items, item];
    const edited = Boolean(editingId);
    save();
    $('#item-dialog').close();
    notify(`${item.title} ${edited ? 'updated' : 'added'}.`);
  } catch (error) {
    $('#form-error').textContent = error.message;
    $('#form-error').hidden = false;
  }
});
for (const selector of ['#search', '#status', '#essential-only']) $(selector).addEventListener('input', render);
$('#undo').addEventListener('click', () => {
  if (!deleted) return;
  if (items.length >= 500) { notify('Remove another item before restoring this one.'); return; }
  items.splice(deleted.index, 0, deleted.item);
  deleted = null;
  save();
  notify('Item restored.');
  $('#add-item').focus();
});
$('#dismiss').addEventListener('click', () => { $('#notice').hidden = true; $('#add-item').focus(); });
$('#export').addEventListener('click', () => {
  const blob = new Blob([encodeChecklist(items)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'readypack-checklist.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Checklist exported.');
});
$('#import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async () => {
  const file = $('#import-file').files[0];
  if (!file) return;
  try {
    if (file.size > 1024 * 1024) throw new Error('Choose a JSON file smaller than 1 MB.');
    const imported = decodeChecklist(await file.text());
    if (!window.confirm('Replace this checklist with the imported items?')) return;
    items = imported;
    deleted = null;
    resetFilters();
    save();
    notify(`Imported ${items.length} items.`);
  } catch (error) { notify(`Import failed: ${error.message}`); }
  finally { $('#import-file').value = ''; }
});
function resetFilters() {
  category = 'All';
  $('#search').value = '';
  $('#status').value = 'all';
  $('#essential-only').checked = false;
}
$('#reset').addEventListener('click', () => {
  if (!window.confirm('Replace your checklist with the fictional sample items? Export first if you want to keep your list.')) return;
  items = sampleItems();
  deleted = null;
  resetFilters();
  save();
  notify('Sample checklist restored.');
});
render();
