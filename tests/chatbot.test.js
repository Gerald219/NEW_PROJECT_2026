import test from 'node:test';
import assert from 'node:assert/strict';
import { recognizeService, scoreText } from '../chatbot/js/serviceRecognition.js';
import { validateReasoning, makeFixture, reasonAboutSituation } from '../chatbot/js/situationReasoning.js';
import { AdaptiveIntake } from '../chatbot/js/AdaptiveIntake.js';

for (const [text, expected] of [
  ["I lost my driver's license", 'affidavit'], ['Perdí mi licencia de conducir', 'affidavit'], ['DECLARACIÓN JURADA', 'affidavit'], ['estudio de título', 'property'], ['I need child support', 'family'], ['necesito ayuda con custodia', 'family'], ['Me despidieron del empleo', 'employment'], ['My father passed away', 'estate'], ['I need a will', 'estate'], ['Can I talk to someone?', 'human'], ['Me arrestaron, es un caso penal', 'human'],
]) test(`routes ${text}`, () => assert.equal(recognizeService(text).primaryService, expected));
test('short keyword does not match inside another word', () => assert.equal(recognizeService('I am willing to help').found, false));
test('empty input does not match', () => assert.equal(recognizeService('  ').found, false));
test('overlapping aliases do not inflate confidence', () => assert.equal(scoreText('title search', ['title', 'title search']), 4));
test('multiple relevant services remain available', () => { const result = recognizeService('I need an estate and property review'); assert.deepEqual(new Set(result.candidates.map(candidate => candidate.id)), new Set(['estate', 'property'])); });
test('criminal terms override another matching service', () => assert.equal(recognizeService('arrest and property documents').requiresHuman, true));
test('lost-license subtype remains specific', () => assert.equal(recognizeService('Perdí mi licencia').affidavitType, 'lost-license'));
test('valid replay stays catalog constrained', () => assert.deepEqual(validateReasoning(makeFixture(['estate', 'property'])).candidates.map(candidate => candidate.id), ['estate', 'property']));
test('Spanish names resolve exactly', () => assert.equal(validateReasoning(makeFixture(['family'], 'es'), 'es').primaryService, 'family'));
test('invented service is rejected', () => assert.equal(validateReasoning({ ...makeFixture(['estate']), primaryService: 'Estate intake plus a secret service' }), null));
test('missing fields are rejected', () => assert.equal(validateReasoning({ understood: true }), null));
test('wrong field types are rejected', () => assert.equal(validateReasoning({ ...makeFixture(['estate']), understood: 'true' }), null));
test('extra fields cannot add workflow commands', () => assert.equal(validateReasoning({ ...makeFixture(['estate']), bookNow: true }), null));
test('primary must be represented in candidates', () => assert.equal(validateReasoning({ ...makeFixture(['estate']), primaryService: 'Property document review' }), null));
test('unknown candidate is rejected', () => assert.equal(validateReasoning({ ...makeFixture(['estate']), candidates: [{ name: 'Secret', plain: '', group: '' }] }), null));
test('oversized response is rejected', () => assert.equal(validateReasoning({ ...makeFixture(['estate']), acknowledgment: 'x'.repeat(241) }), null));
test('failed adapter produces a recoverable result', async () => assert.equal((await reasonAboutSituation('estate', 'en', async () => { throw Error('offline'); })).error, 'adapter-unavailable'));
test('workflow rejects skipping directly to completion', () => assert.equal(new AdaptiveIntake().complete(), false));
test('three failed recognitions end with simulated handoff', async () => { const flow = new AdaptiveIntake(); for (const text of ['hmm', 'unknown', 'still unsure']) await flow.submit(text); assert.equal(flow.stage, 'handoff'); assert.equal(flow.summary().handoff, true); });
test('invalid model output enters clarification', async () => { const flow = new AdaptiveIntake(); await flow.submit('help', async () => ({ broken: true })); assert.equal(flow.stage, 'request'); assert.equal(flow.failures, 1); });
test('catalog choice recovers after two failures', async () => { const flow = new AdaptiveIntake(); await flow.submit('unknown'); await flow.submit('hmm'); assert.equal(flow.stage, 'browse'); assert.equal(flow.select('family'), true); assert.equal(flow.failures, 0); assert.equal(flow.stage, 'detail'); });
test('full flow preserves request urgency, documents, detail and preference', async () => { const flow = new AdaptiveIntake(); await flow.submit('I need property documents by tomorrow'); assert.equal(flow.urgent, true); flow.select('property'); flow.answer('Document review'); flow.setDocuments(['Sample property record']); flow.setUrgency(true); flow.setPreference('appointment'); assert.equal(flow.stage, 'summary'); flow.complete(); const data = flow.summary(); assert.equal(data.objective, 'I need property documents by tomorrow'); assert.equal(data.preference, 'appointment'); assert.equal(data.simulated, true); assert.deepEqual(data.documents, ['Sample property record']); assert.equal(flow.stage, 'done'); });
test('invalid details and document names cannot advance the flow', async () => { const flow = new AdaptiveIntake(); await flow.submit('property'); flow.select('property'); assert.equal(flow.answer('Book a real appointment'), false); flow.answer('Sale'); assert.equal(flow.setDocuments(['private file']), false); assert.equal(flow.stage, 'documents'); });
test('stale adapter result cannot restore a reset session', async () => { const flow = new AdaptiveIntake(); let finish; const pending = flow.submit('estate', () => new Promise(resolve => { finish = resolve; })); flow.reset('es'); finish(makeFixture(['estate'])); await pending; assert.equal(flow.stage, 'request'); assert.equal(flow.lang, 'es'); assert.equal(flow.objective, ''); });
test('human handoff cannot be replaced by a pending adapter response', async () => { const flow = new AdaptiveIntake(); let finish; const pending = flow.submit('estate', () => new Promise(resolve => { finish = resolve; })); flow.handoff(); finish(makeFixture(['estate'])); await pending; assert.equal(flow.stage, 'handoff'); });
test('criminal request never calls the model adapter', async () => { const flow = new AdaptiveIntake(); let called = false; await flow.submit('I was arrested', async () => { called = true; return makeFixture(['property']); }); assert.equal(called, false); assert.equal(flow.stage, 'handoff'); });
test('exported summary does not expose mutable internal arrays', () => { const flow = new AdaptiveIntake(); const data = flow.summary(); data.messages.push({ text: 'fake' }); assert.equal(flow.messages.length, 1); });
