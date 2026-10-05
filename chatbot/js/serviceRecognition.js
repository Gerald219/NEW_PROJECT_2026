import { SERVICES } from './catalog.js';

export function normalize(text) {
  return String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
export function containsPhrase(text, phrase) {
  return (` ${normalize(text)} `).includes(` ${normalize(phrase)} `);
}
export function scoreText(text, keywords) {
  // Take the strongest match rather than adding overlapping aliases repeatedly.
  return Math.max(0, ...keywords.filter(keyword => containsPhrase(text, keyword)).map(keyword => Math.max(3, normalize(keyword).length / 3)));
}
export function recognizeService(text) {
  const normalized = normalize(text);
  if (!normalized) return { found: false, candidates: [], confidence: 'none' };
  const human = SERVICES.find(service => service.id === 'human');
  if (human.keywords.some(keyword => containsPhrase(text, keyword))) return { found: true, primaryService: 'human', candidates: [{ id: 'human', score: 1 }], confidence: 'high', requiresHuman: true };
  const candidates = SERVICES.filter(service => service.id !== 'human').map(service => ({ id: service.id, score: scoreText(text, service.keywords) })).filter(candidate => candidate.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
  if (!candidates.length) return { found: false, candidates: [], confidence: 'none' };
  const ambiguous = candidates.length > 1 && candidates[0].score - candidates[1].score < 2;
  return { found: true, primaryService: candidates[0].id, candidates, confidence: ambiguous || candidates[0].score <= 6 ? 'low' : 'high', ambiguous,
    needsAffidavitPicker: candidates[0].id === 'affidavit',
    affidavitType: candidates[0].id === 'affidavit' && ['lost license', 'lost driver license', 'lost drivers license', 'lost my driver license', 'lost my driver s license', 'perdi la licencia', 'perdi mi licencia', 'licencia perdida'].some(keyword => containsPhrase(text, keyword)) ? 'lost-license' : null };
}
