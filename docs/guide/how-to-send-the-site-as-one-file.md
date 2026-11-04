# How to send the site as one file

Use this to send the landing, the test and the result page for review to someone without access to the test site.

1. From the repository root run `bun scripts/export-html.ts tmp/smart-as-site.html`. It prints `Wrote tmp/smart-as-site.html`.
2. Open the file in a browser by double-click. The landing opens.
3. Check the path: «Start the free test», both sections, Submit, the result page, «Retake the test».
4. Send the file. It needs no server; the reader opens it the same way.

Rebuild the file after any change in `site/`: it holds a copy of the pages, not links to them. Do not commit it.

Without internet the file opens with system fonts instead of the Smart As fonts.
