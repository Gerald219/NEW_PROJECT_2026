# Validation record — 2026-10-04

Validation was performed during AI-assisted development. These results are project checks, not a certification of the author's independent skill or production readiness.

## Passed locally

- **20 core tests:** Node.js 24.19.0, using `npm test`.
- **19 browser workflow checks:** Chromium headless 154.0.8037.92, Playwright 1.62.1, using `npm run test:browser` with an existing Chromium executable.
- **Responsive checks:** desktop 1440px and mobile viewport 390px; no horizontal page overflow at 390px; the item dialog fits the viewport.
- **Screenshots:** captured from the checked application at desktop and mobile sizes, including the mobile item form.
- **Page exceptions:** none observed during the checked browser workflows.
- **Bug report evidence:** original shell revision compiled and run to reproduce the absolute-command and noninteractive-output defects; the corresponding fixes are linked in the reports.

## Browser workflows covered

Initial sample/progress; whitespace validation; invalid quantity; add and reload persistence; edit preserving packed state; combined filters; delete/undo; no-match state; export contents; malformed import without data loss; cancel reset; import round-trip; HTML-like names rendered as text; empty-list progress; packing under a filter with usable focus; dialog Escape/focus return; narrow-screen layout/form; denied storage fallback; and page-exception monitoring.

## Not yet established

- Firefox and Safari behavior.
- Screen-reader usability or full WCAG conformance.
- Physical-device touch behavior.
- Stress testing large lists in multiple browsers.
- A live hosted deployment; Pages must be enabled separately.

GitHub Actions repeats the core and browser workflow checks. The README should link to actual workflow runs rather than claim unobserved CI outcomes.
