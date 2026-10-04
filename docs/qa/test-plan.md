# ReadyPack QA test plan

## Purpose and scope

Verify that the packing checklist handles edits, packing progress, combined filters, persistence, safe import/export, and narrow screens. All sample data is fictional. There is no backend, authentication, or shared account.

## Environments

- Node.js 24: core logic tests, run with `npm test`.
- Chromium desktop and mobile viewport: interactive workflow checks.
- Manual follow-up: Firefox, Safari/iOS, screen-reader behavior, and touch-device testing. A responsive viewport does not substitute for a physical-device test.

## Test cases

| ID | Action | Expected result |
| --- | --- | --- |
| RP-01 | Open in a fresh browser context | Eight sample items; three packed; two essentials left; 38% completion |
| RP-02 | Add `Travel adapter`, Electronics, quantity 2, essential | One new row; counts update; reload preserves it |
| RP-03 | Edit the item's name and quantity after packing it | New values appear; packed state is preserved |
| RP-04 | Add a whitespace-only name | Form rejects the entry and keeps the dialog open |
| RP-05 | Enter quantity 0, 1.5, or 100 | Form rejects invalid quantity |
| RP-06 | Combine category, search, status, and essentials filters | Only matching rows appear; overall progress still counts all rows |
| RP-07 | Toggle packing while the Unpacked filter is active | Packed row leaves the results; keyboard focus remains usable |
| RP-08 | Delete an item, then choose Undo | Original row, values, and packed status are restored |
| RP-09 | Export, change the list, and import the export | Data returns to the exported state after confirmation |
| RP-10 | Import malformed JSON, duplicate IDs, invalid flags, or over 500 items | Readable failure message; current checklist remains unchanged |
| RP-11 | Import a name containing HTML markup | Name renders as text; markup does not execute |
| RP-12 | Deny browser storage | App remains usable and warns that changes are temporary |
| RP-13 | Reset demo and accept confirmation | Original sample list and filters return |
| RP-14 | Cancel reset or import confirmation | Current checklist remains unchanged |
| RP-15 | Use 390px viewport | No horizontal page overflow; controls and dialog fit |
| RP-16 | Navigate by keyboard; open form; press Escape | Focus is visible; dialog closes and returns focus |
| RP-17 | Delete all items | Progress stays at 0%, with an empty-state explanation |
| RP-18 | Fill a list to 500 rows and try adding another | Entry is refused without changing the checklist |

## Exit criteria

- All core tests pass.
- Main browser workflow checks pass without page exceptions.
- Desktop and mobile screenshots reflect the checked implementation.
- Any untested browser or accessibility scenarios remain clearly identified.

## Limitations

This sample is intended to demonstrate testing practice, not certify a production system. Browser storage can be cleared and is not a secure records-management database.
