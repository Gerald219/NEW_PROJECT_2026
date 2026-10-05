import { SERVICES, serviceById, label } from './catalog.js';
import { AdaptiveIntake } from './AdaptiveIntake.js';
import { REPLAY_EXAMPLES, makeFixture } from './situationReasoning.js';
const intake = new AdaptiveIntake('en');
const $ = id => document.getElementById(id);
const t = (en, es) => intake.tr(en, es);
function element(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
function button(text, action, className = 'secondary') { const node = element('button', text, className); node.type = 'button'; node.addEventListener('click', action); return node; }
const mutate = action => () => { action(); render(); };
async function run(text, adapter = null) {
  if (intake.busy) return;
  const pending = intake.submit(text, adapter); render(); await pending; $('request').value = ''; render();
}
function cards(ids) {
  const wrap = element('div', undefined, 'cards');
  for (const id of ids) {
    const service = serviceById(id);
    const card = button('', mutate(() => intake.select(id)), 'service-card');
    card.append(element('small', label(service.group, intake.lang)), element('strong', label(service.name, intake.lang)), element('p', label(service.plain, intake.lang))); wrap.append(card);
  }
  return wrap;
}
function summaryCard() {
  const data = intake.summary(); const card = element('section', undefined, 'summary-card'); card.id = 'intake-summary';
  card.append(element('h3', t('Your sample summary', 'Su resumen de ejemplo')));
  const dl = element('dl');
  const rows = [[t('Service', 'Servicio'), data.service || t('Team review', 'Revisión del equipo')], [t('Sample client', 'Cliente ficticio'), `${data.fictionalContact.name} · ${data.fictionalContact.email}`], [t('Detail', 'Detalle'), data.detail || '—'], [t('Documents', 'Documentos'), data.documents.join(', ') || t('Provide later', 'Entregar después')], [t('Priority', 'Prioridad'), data.urgent ? t('Urgent', 'Urgente') : t('Standard', 'Normal')], [t('Follow-up', 'Seguimiento'), data.preference ? ({ email: t('Email', 'Correo'), phone: t('Phone', 'Llamada'), appointment: t('Appointment request', 'Solicitud de cita') })[data.preference] : '—']];
  for (const [name, value] of rows) dl.append(element('dt', name), element('dd', value));
  card.append(dl, element('p', t('Simulation only. No request is sent and no appointment is booked.', 'Solo simulación. No se envía una solicitud ni se reserva una cita.'), 'notice')); return card;
}
function exportSummary() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(intake.summary(), null, 2)], { type: 'application/json' }));
  const link = element('a'); link.href = url; link.download = 'sample-intake-summary.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function render() {
  const oldFocus = document.activeElement;
  document.documentElement.lang = intake.lang;
  document.querySelector('h1').textContent = t('A clearer path. A better handoff.', 'Una ruta clara. Un mejor seguimiento.');
  document.querySelector('.eyebrow').textContent = t('BILINGUAL SERVICE NAVIGATION', 'GUÍA BILINGÜE DE SERVICIOS');
  document.querySelector('.lead').textContent = t('A guided conversation that turns everyday requests into an organized intake summary.', 'Una conversación guiada que convierte solicitudes cotidianas en un resumen organizado.');
  $('chat-title').textContent = t('Your intake guide', 'Su guía de recepción');
  $('mode-status').textContent = intake.busy ? t('Processing sample…', 'Procesando ejemplo…') : intake.engine === 'replay' ? t('Automated demo · replay fixture', 'Demo automática · respuesta simulada') : t('Automated demo · rules mode', 'Demo automática · reglas');
  $('request-label').textContent = t('What do you need?', '¿Qué necesita?');
  $('request').placeholder = t("Try: I lost my driver's license", 'Ejemplo: Perdí mi licencia de conducir');
  $('input-hint').textContent = t('Sample requests only · up to 500 characters', 'Solo solicitudes de ejemplo · hasta 500 caracteres');
  $('send').textContent = t('Continue →', 'Continuar →'); $('send').disabled = intake.busy; $('request').disabled = intake.busy;
  $('request-form').hidden = !['request', 'browse'].includes(intake.stage);
  $('browse').textContent = t('Browse services', 'Ver servicios'); $('browse').disabled = !['request', 'confirm'].includes(intake.stage) || intake.busy;
  $('human').textContent = t('Team review', 'Revisión del equipo'); $('human').disabled = ['done', 'handoff'].includes(intake.stage) || intake.busy;
  $('reset').textContent = t('Start over', 'Comenzar de nuevo');
  $('privacy-title').textContent = t('Fictional examples. Local conversation.', 'Ejemplos ficticios. Conversación local.');
  $('privacy-copy').textContent = t('No live AI, uploads, appointment bookings, or staff notifications. Use sample information only. Nothing is saved after a page reload.', 'Sin IA en vivo, cargas, reservas de citas ni notificaciones al personal. Use solo información ficticia. Nada se conserva al recargar.');
  $('sample-title').textContent = t('Take it for a test drive', 'Pruebe la demostración');
  $('samples').replaceChildren();
  const examples = [
    { title: t('A lost driver’s license', 'Una licencia de conducir perdida'), text: t('I lost my driver license and need an affidavit.', 'Perdí la licencia y necesito una declaración jurada.'), mode: 'rules' },
    { title: label(REPLAY_EXAMPLES[0].label, intake.lang), text: label(REPLAY_EXAMPLES[0].text, intake.lang), mode: 'replay', services: REPLAY_EXAMPLES[0].services },
    { title: t('An unclear request', 'Una solicitud poco clara'), text: t('I need help with something.', 'Necesito ayuda con algo.'), mode: 'rules' },
    { title: t('An invalid model response', 'Una respuesta de modelo inválida'), text: label(REPLAY_EXAMPLES[1].text, intake.lang), mode: 'invalid' },
  ];
  for (const example of examples) {
    const node = button('', () => { intake.reset(intake.lang); render(); const adapter = example.mode === 'replay' ? async ({ lang }) => makeFixture(example.services, lang) : example.mode === 'invalid' ? async () => ({ ...makeFixture(['property'], intake.lang), primaryService: 'Invented catalog service' }) : null; run(example.text, adapter); }, 'sample');
    node.append(element('span', example.title), element('span', example.mode === 'rules' ? t('RULES', 'REGLAS') : t('REPLAY', 'SIMULADA'))); node.disabled = intake.busy; $('samples').append(node);
  }
  const stages = ['request', 'detail', 'documents', 'summary'];
  const active = ['request', 'confirm', 'browse'].includes(intake.stage) ? 0 : intake.stage === 'detail' ? 1 : ['documents', 'urgency', 'preference'].includes(intake.stage) ? 2 : 3;
  $('journey').replaceChildren();
  const journeyLabels = [t('Request', 'Solicitud'), t('Details', 'Detalles'), t('Prepare', 'Preparar'), t('Review', 'Revisar')];
  for (let i = 0; i < stages.length; i++) { const li = element('li', undefined, i === active ? 'current' : i < active ? 'passed' : ''); if (i === active) li.setAttribute('aria-current', 'step'); li.append(element('span', i < active ? '✓' : String(i + 1)), document.createTextNode(journeyLabels[i])); $('journey').append(li); }
  const transcript = $('transcript'); transcript.replaceChildren();
  for (const message of intake.messages) { const row = element('div', undefined, `message ${message.role}`); if (message.role === 'assistant') row.append(element('span', '✦', 'bubble-icon')); row.append(element('p', message.text)); transcript.append(row); }
  transcript.scrollTop = transcript.scrollHeight;
  const actions = $('actions'); actions.replaceChildren();
  if (intake.stage === 'confirm' || intake.stage === 'browse') { actions.append(element('p', t('Choose a service to continue', 'Elija un servicio para continuar'), 'actions-title'), cards(intake.stage === 'browse' ? SERVICES.map(service => service.id) : intake.candidates)); }
  if (intake.stage === 'detail') {
    const wrap = element('div', undefined, 'choices'); for (const option of label(serviceById(intake.service).options, intake.lang)) wrap.append(button(option, mutate(() => intake.answer(option)))); actions.append(wrap);
  }
  if (intake.stage === 'documents') {
    const form = element('form'); form.id = 'documents-form';
    for (const [index, documentName] of label(serviceById(intake.service).docs, intake.lang).entries()) { const item = element('label', undefined, 'doc-check'); const check = element('input'); check.type = 'checkbox'; check.name = 'document'; check.value = documentName; check.id = `document-${index}`; item.append(check, element('span', documentName)); form.append(item); }
    form.append(element('p', t('This is a readiness checklist, not a legal requirement or an upload.', 'Es una lista de preparación, no un requisito legal ni una carga.'), 'doc-note'));
    const next = element('button', t('Continue', 'Continuar'), 'primary'); next.type = 'submit'; form.append(next); form.addEventListener('submit', event => { event.preventDefault(); intake.setDocuments([...form.querySelectorAll('input:checked')].map(input => input.value)); render(); }); actions.append(form);
  }
  if (intake.stage === 'urgency') { const wrap = element('div', undefined, 'choices'); wrap.append(button(t('Yes, urgent', 'Sí, urgente'), mutate(() => intake.setUrgency(true))), button(t('No urgency', 'Sin urgencia'), mutate(() => intake.setUrgency(false)))); actions.append(wrap); }
  if (intake.stage === 'preference') { const wrap = element('div', undefined, 'choices'); for (const [id, text] of [['email', t('Email', 'Correo')], ['phone', t('Phone', 'Llamada')], ['appointment', t('Appointment request', 'Solicitud de cita')]]) wrap.append(button(text, mutate(() => intake.setPreference(id)))); actions.append(wrap); }
  if (['summary', 'done', 'handoff'].includes(intake.stage)) {
    if (intake.stage === 'handoff') actions.append(element('p', t('Team review simulation', 'Simulación de revisión del equipo'), 'complete'));
    if (intake.stage === 'done') actions.append(element('p', t('✓ Demo complete', '✓ Demostración completada'), 'complete'));
    actions.append(summaryCard()); const wrap = element('div', undefined, 'buttons'); if (intake.stage === 'summary') wrap.append(button(t('Finish demo', 'Terminar demostración'), mutate(() => intake.complete()), 'primary')); wrap.append(button(t('Export sample summary', 'Exportar resumen de ejemplo'), exportSummary)); actions.append(wrap);
  }
  $('inspector').textContent = JSON.stringify({ stage: intake.stage, source: intake.engine, failures: intake.failures, service: intake.service, response: intake.lastResponse }, null, 2);
  if (oldFocus && oldFocus !== document.body && !oldFocus.isConnected) {
    const next = actions.querySelector('button, input') || (!$('request-form').hidden ? $('request') : $('reset'));
    next.focus();
  }
}
$('request-form').addEventListener('submit', event => { event.preventDefault(); run($('request').value); });
$('browse').addEventListener('click', mutate(() => intake.browse()));
$('human').addEventListener('click', mutate(() => intake.handoff()));
$('reset').addEventListener('click', () => { intake.reset(); $('request').value = ''; render(); $('request').focus(); });
$('language').addEventListener('change', event => { intake.reset(event.target.value); $('request').value = ''; render(); });
render();
