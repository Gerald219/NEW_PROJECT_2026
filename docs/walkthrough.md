# ReadyPack walkthrough

## One-minute demonstration

1. Start the app with `npm start`, then open `http://127.0.0.1:8000`.
2. Explain the goal: keeping track of packing essentials with a small browser-based checklist.
3. Add an essential item, `Travel adapter`, under Electronics with quantity 2.
4. Mark it packed and point out the updated progress and essentials count.
5. Filter Electronics, search for `adapter`, then edit the quantity.
6. Delete the row and restore it with Undo.
7. Export the checklist; reload to show browser persistence.
8. Show `npm test` and the QA test plan and bug report samples.

## Accurate project explanation

ReadyPack is an independent portfolio demonstration based on the packing-project direction originally written in this repository. It was developed with AI assistance. It uses HTML, CSS, and JavaScript with local browser storage; Node runs the local server and tests. It is separate from private business applications and contains only fictional sample data.

The core logic is in `js/checklist.js`; browser rendering and interactions are in `js/app.js`. The logic tests cover validation, filters, edits, progress, and import/export. Review and understand those functions before describing them in an interview.

Do not describe this as a deployed client system, paid employment, or code written entirely without assistance. There is no backend, account system, database service, or cloud certification implied by this project.
