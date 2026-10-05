# Source mapping

The supplied files were reviewed privately. Their raw contents are not published because they include office-specific instructions and integrations. No change was made to the private application.

| Supplied file | Confirmed source behavior | Public counterpart | Adaptation |
| --- | --- | --- | --- |
| `AdaptiveIntake.jsx` | React state for service confirmation, contact, questions, documents, urgency, consultation and summary; three-level failed-recognition recovery | `js/AdaptiveIntake.js`, `js/app.js` | Framework-independent state machine; fictional contact only; readiness checklist replaces uploads; preferences replace real scheduling; handoff is explicit simulation |
| `assistantPrompt.js` | Bilingual persona/style instructions, service-first workflow, unsupported-answer fallback and escalation instructions | `js/assistantPrompt.js` | Generic transparent automated identity; no office contacts, prices, background, or raw private prompt |
| `situationReasoning.js` | Base44 `InvokeLLM` call with required JSON fields and catalog-name resolution | `js/situationReasoning.js` | Injectable adapter with offline fixtures, stricter field validation and exact normalized catalog matching; no live provider |
| `serviceRecognition.js` | Bilingual keyword scoring; catalog/profile mapping; affidavit specificity and generic picker | `js/serviceRecognition.js`, `js/catalog.js` | Fictional catalog, accent normalization and word boundaries; general custody stays a family request; explicit person/criminal handoff |

## Accurate portfolio claims

- Demonstrates a bilingual service-navigation workflow adapted from AI-assisted legal-intake project work.
- Includes example system prompts, structured-response validation, deterministic recognition, and tested workflow recovery.
- Includes public-demo automated tests and browser checks.

## Claims this evidence does not establish

- Sole authorship of every supplied function or prompt.
- A completed production platform, live AI performance, or deployed business integrations.
- Formal chatbot-quality rating rubrics, recorded evaluation employment, or measured business improvements.
- Automatic typo correction, factual verification of generated legal answers, or production security certification.
