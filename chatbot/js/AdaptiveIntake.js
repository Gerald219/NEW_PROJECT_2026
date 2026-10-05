import { serviceById, label } from './catalog.js';
import { recognizeService, containsPhrase } from './serviceRecognition.js';
import { reasonAboutSituation } from './situationReasoning.js';

export const STAGES = ['request', 'confirm', 'detail', 'documents', 'urgency', 'preference', 'summary', 'done'];
export class AdaptiveIntake {
  constructor(lang = 'en') { this.reset(lang); }
  reset(lang = this.lang) {
    this.lang = lang === 'es' ? 'es' : 'en'; this.stage = 'request'; this.messages = []; this.failures = 0; this.objective = ''; this.candidates = []; this.service = null; this.detail = ''; this.documents = []; this.urgent = false; this.preference = ''; this.engine = 'rules'; this.lastResponse = null; this.busy = false; this.revision = (this.revision || 0) + 1;
    this.add('assistant', this.tr('Tell me what you need, or try a sample below.', 'Cuénteme qué necesita o pruebe un ejemplo.'));
  }
  tr(en, es) { return this.lang === 'es' ? es : en; }
  add(role, text) { this.messages.push({ role, text }); }
  async submit(text, adapter = null) {
    if (!['request', 'browse'].includes(this.stage) || this.busy || typeof text !== 'string' || !text.trim() || text.trim().length > 500) return false;
    this.busy = true; const revision = this.revision;
    const request = text.trim(); this.objective = this.objective ? `${this.objective}\n${request}` : request; this.add('user', request);
    this.urgent ||= ['urgent', 'deadline', 'tomorrow', 'urgente', 'fecha limite', 'manana'].some(phrase => containsPhrase(request, phrase));
    const deterministic = recognizeService(request);
    if (deterministic.requiresHuman) { this.busy = false; this.service = 'human'; this.handoff(); return true; }
    const result = await reasonAboutSituation(this.objective, this.lang, adapter);
    if (revision !== this.revision) return false;
    this.busy = false; this.engine = result.source; this.lastResponse = result;
    if (!result.data?.understood) {
      this.failures++; this.candidates = [];
      if (this.failures === 1) { this.stage = 'request'; this.add('assistant', this.tr('Is this about a property, a document, family, or work?', '¿Es sobre una propiedad, un documento, familia o trabajo?')); }
      else if (this.failures === 2) { this.stage = 'browse'; this.add('assistant', this.tr('Choose the closest service below, or ask for team review.', 'Elija el servicio más cercano o pida revisión del equipo.')); }
      else this.handoff();
      return true;
    }
    // A validated model can suggest handoff, but cannot bypass confirmation or intake stages.
    this.candidates = result.data.candidates.map(candidate => candidate.id); this.service = result.data.primaryService; this.stage = 'confirm'; this.failures = 0;
    this.add('assistant', result.data.acknowledgment); return true;
  }
  browse() { if (this.stage === 'request' || this.stage === 'confirm') { this.stage = 'browse'; return true; } return false; }
  select(id) {
    if (!['confirm', 'browse'].includes(this.stage) || !serviceById(id) || (this.stage === 'confirm' && !this.candidates.includes(id))) return false;
    this.service = id; this.candidates = []; this.failures = 0; this.add('user', label(serviceById(id).name, this.lang));
    if (id === 'human') this.handoff(); else { this.stage = 'detail'; this.add('assistant', label(serviceById(id).question, this.lang)); } return true;
  }
  answer(value) {
    if (this.stage !== 'detail' || !label(serviceById(this.service)?.options, this.lang).includes(value)) return false;
    this.detail = value; this.add('user', value); this.stage = 'documents'; this.add('assistant', this.tr('Mark the fictional documents you would have ready. No uploads are needed.', 'Marque los documentos ficticios que tendría listos. No hace falta subir archivos.')); return true;
  }
  setDocuments(values) {
    if (this.stage !== 'documents' || !Array.isArray(values)) return false;
    const allowed = label(serviceById(this.service).docs, this.lang);
    if (values.some(value => !allowed.includes(value))) return false;
    this.documents = [...new Set(values)]; this.stage = 'urgency'; this.add('assistant', this.tr('Is there a deadline or urgency?', '¿Hay una fecha límite o urgencia?')); return true;
  }
  setUrgency(value) {
    if (this.stage !== 'urgency' || typeof value !== 'boolean') return false;
    this.urgent = value; this.stage = 'preference'; this.add('user', this.tr(value ? 'Urgent' : 'No urgency', value ? 'Urgente' : 'Sin urgencia')); this.add('assistant', this.tr('Choose a follow-up preference for this simulation.', 'Elija una preferencia de seguimiento para esta simulación.')); return true;
  }
  setPreference(value) {
    if (this.stage !== 'preference' || !['email', 'phone', 'appointment'].includes(value)) return false;
    this.preference = value; this.stage = 'summary'; this.add('assistant', this.tr('Review the sample summary. Nothing will be sent or booked.', 'Revise el resumen de ejemplo. No se enviará ni reservará nada.')); return true;
  }
  complete() {
    if (this.stage !== 'summary') return false;
    this.stage = 'done'; this.add('assistant', this.tr('Demo complete. The summary stays in this tab only.', 'Demostración completada. El resumen queda solo en esta pestaña.')); return true;
  }
  handoff() { if (this.stage === 'done' || this.stage === 'handoff') return false; this.revision++; this.busy = false; this.stage = 'handoff'; this.add('assistant', this.tr('Simulated team review: no live team has been contacted.', 'Revisión del equipo simulada: no se ha contactado a un equipo real.')); return true; }
  summary() { return { version: 1, simulated: true, language: this.lang, service: this.service ? label(serviceById(this.service)?.name, this.lang) : '', objective: this.objective, detail: this.detail, fictionalContact: { name: 'Alex Example', email: 'alex@example.com' }, documents: [...this.documents], urgent: this.urgent, preference: this.preference, handoff: this.stage === 'handoff', messages: this.messages.map(message => ({ ...message })) }; }
}
