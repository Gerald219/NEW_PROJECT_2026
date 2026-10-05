import { SERVICES, serviceById, label } from './catalog.js';
import { normalize, recognizeService } from './serviceRecognition.js';
import { ASSISTANT_SYSTEM_PROMPT } from './assistantPrompt.js';

export const RESPONSE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['understood', 'acknowledgment', 'candidates', 'primaryService', 'followUp', 'quickReplies'],
  properties: {
    understood: { type: 'boolean' }, acknowledgment: { type: 'string', maxLength: 240 },
    candidates: { type: 'array', maxItems: 4, items: { type: 'object', additionalProperties: false, required: ['name', 'plain', 'group'], properties: { name: { type: 'string' }, plain: { type: 'string', maxLength: 240 }, group: { type: 'string', maxLength: 80 } } } },
    primaryService: { type: 'string' }, followUp: { type: 'string', maxLength: 240 }, quickReplies: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 40 } },
  },
};
export const REASONING_SYSTEM_PROMPT = lang => `${ASSISTANT_SYSTEM_PROMPT}\nReply in ${lang === 'es' ? 'Spanish' : 'English'}. Use only these exact catalog names:\n${SERVICES.map(service => label(service.name, lang)).join('\n')}\nReturn understood, acknowledgment, candidates, primaryService, followUp and quickReplies.`;
export function resolvePrimaryService(raw, lang) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return SERVICES.find(service => normalize(label(service.name, lang)) === normalize(raw))?.id || null;
}
// Reject rather than repair invented catalog entries or malformed model fields.
export function validateReasoning(raw, lang = 'en') {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const keys = RESPONSE_SCHEMA.required;
  if (Object.keys(raw).some(key => !keys.includes(key)) || keys.some(key => !(key in raw))) return null;
  if (typeof raw.understood !== 'boolean' || !['acknowledgment', 'primaryService', 'followUp'].every(key => typeof raw[key] === 'string' && raw[key].length <= 240)) return null;
  if (!Array.isArray(raw.candidates) || raw.candidates.length > 4 || !Array.isArray(raw.quickReplies) || raw.quickReplies.length > 4 || raw.quickReplies.some(value => typeof value !== 'string' || !value.trim() || value.length > 40)) return null;
  const candidates = [];
  for (const candidate of raw.candidates) {
    if (!candidate || Object.keys(candidate).some(key => !['name', 'plain', 'group'].includes(key)) || !['name', 'plain', 'group'].every(key => typeof candidate[key] === 'string')) return null;
    const id = resolvePrimaryService(candidate.name, lang);
    if (!id || candidate.plain.length > 240 || candidate.group.length > 80) return null;
    if (!candidates.some(value => value.id === id)) candidates.push({ ...candidate, id });
  }
  const primaryService = resolvePrimaryService(raw.primaryService, lang);
  if (raw.understood && (!primaryService || !candidates.some(candidate => candidate.id === primaryService))) return null;
  if (!raw.understood && (raw.primaryService !== '' || candidates.length !== 0)) return null;
  return { ...raw, candidates, primaryService, understood: raw.understood && !!primaryService };
}
export function makeFixture(ids, lang = 'en') {
  const services = ids.map(serviceById).filter(Boolean);
  return { understood: services.length > 0, acknowledgment: lang === 'es' ? 'Podemos organizar esta solicitud. Primero confirme el servicio.' : 'We can organize this request. First, confirm the service.', candidates: services.map(service => ({ name: label(service.name, lang), plain: label(service.plain, lang), group: label(service.group, lang) })), primaryService: services[0] ? label(services[0].name, lang) : '', followUp: lang === 'es' ? '¿Cuál es el tema principal?' : 'Which topic is most important?', quickReplies: [] };
}
// Replay fixtures are explicit examples, not generated AI answers.
export const REPLAY_EXAMPLES = [
  { id: 'estate-property', label: { en: 'An inherited property', es: 'Una propiedad heredada' }, text: { en: 'My father passed away and left a house. Where do I start?', es: 'Mi papá falleció y dejó una casa. ¿Por dónde empiezo?' }, services: ['estate', 'property'] },
  { id: 'bad-output', label: { en: 'Invalid model output', es: 'Respuesta de modelo inválida' }, text: { en: 'Demonstrate an invented service', es: 'Demostrar un servicio inventado' }, services: [] },
];
export async function reasonAboutSituation(text, lang = 'en', adapter = null) {
  if (!adapter) {
    const recognized = recognizeService(text);
    return { source: 'rules', data: recognized.found ? validateReasoning(makeFixture(recognized.candidates.map(candidate => candidate.id), lang), lang) : null, recognition: recognized };
  }
  try {
    const raw = await adapter({ text, lang, prompt: REASONING_SYSTEM_PROMPT(lang), schema: RESPONSE_SCHEMA });
    const data = validateReasoning(raw, lang);
    return { source: 'replay', data, error: data ? null : 'invalid-response' };
  } catch { return { source: 'replay', data: null, error: 'adapter-unavailable' }; }
}
