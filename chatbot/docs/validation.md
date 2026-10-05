# Validation record — 2026-10-05

These checks cover the public AI-assisted adaptation. They do not establish the private application's correctness or production readiness.

## Passed locally

- **37 intake core tests** with Node.js 24.19.0. The combined repository run passed 57 tests, including 20 existing ReadyPack tests.
- **18 intake browser workflow checks** using Playwright 1.62.1 and Chromium headless 154.0.8037.92.
- **19 existing ReadyPack browser checks** passed after the local server was updated to support the intake subdirectory.
- Screenshots inspected at desktop 1440px and mobile viewport 390px. No horizontal overflow at 390px.
- No page exceptions or `fetch`/XHR requests were observed in the checked intake flows. No form submission or model API was called.

## Covered behavior

English/Spanish recognition; accents; short-keyword boundaries; competing services; criminal-request precedence; exact catalog-name validation; malformed or invented model output; provider exception; guided stages; document readiness; urgency and follow-up; fictional summary export; three-level recovery; catalog selection; reset and stale-response handling; literal rendering of HTML-like input; keyboard focus; mobile layout; and no retained conversation after reload.

The browser suite includes an English lost-license flow and a Spanish flow with deferred documents and an appointment preference. Replay tests include a two-service inherited-property fixture and a rejected invented service.

## Not established

Live model accuracy; genuine semantic reasoning; production backend behavior; real team chat or scheduling; legal correctness; Firefox/Safari compatibility; full WCAG conformance; screen-reader behavior; physical-device touch interaction; production security; and real-user outcome improvements.

The source files and scripts make the checks reproducible. GitHub Actions repeats the core and browser suites.

## Hosted verification

- [Main-branch CI](https://github.com/Gerald219/NEW_PROJECT_2026/actions/runs/37275082360) passed all core and both browser suites.
- [GitHub Pages deployment](https://github.com/Gerald219/NEW_PROJECT_2026/actions/runs/37275081549) completed successfully.
- The [public demo](https://gerald219.github.io/NEW_PROJECT_2026/chatbot/) was accessed without a GitHub login and passed the same **18 browser workflow checks**, including English and Spanish intake, replay validation, summary export, failure recovery, mobile layout, and no submission requests. Browser access used the execution environment's network proxy; transport security was not audited.
- The profile introduction links directly to the source and live demo.
