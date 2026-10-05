# Recognition and validation regression examples

These examples show review findings and fixes in the public adaptation. Original recognition behavior was reproduced using the supplied algorithm with a synthetic two-service catalog and one synthetic affidavit entry. This isolates the matching behavior; it is not an end-to-end test of the private app or its missing catalog.

## 1. Short keyword inside a different word

- Input: `I am willing to help`.
- Supplied scoring function: substring `includes` permits the `will` keyword to match `willing`.
- Adaptation: normalized phrase boundaries prevent that match; the request goes to clarification.
- Regression: `short keyword does not match inside another word` in `tests/chatbot.test.js`.

## 2. General custody request treated as an affidavit

- Input: `Necesito custodia`.
- Supplied engine with synthetic matching entries: equally scored affidavit and family keywords prefer the affidavit branch because it uses `>=`.
- Adaptation: general custody belongs to the family service. An affidavit requires affidavit-specific wording.
- Regression: `routes necesito ayuda con custodia` in `tests/chatbot.test.js`.

## 3. Broad partial model names

- Supplied model-name resolver uses substring fallback after exact matching; this can accept a partial catalog name. This finding comes from source inspection, not a live-model measurement.
- Adaptation: accept only exact normalized names and require the primary service to appear among validated candidates.
- Reproduction: change the fixture's `primaryService` to `Estate intake plus a secret service`.
- Result: the response is rejected and the UI asks a clarifying question.
- Regression: `invented service is rejected`; browser check `invented model service is rejected and clarification remains usable`.
