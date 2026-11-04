# Reference: pages, files and scoring

## Pages

- `/`: Smart As landing, black and yellow, with the «smart kid» drawings. «Try one now» sample, waitlist form.
- `/test/`: the quick test of the landing, 10 easy questions, in the Bluebook style.
- `/results/`: its result, in the Smart As style. Without a submitted attempt it sends the student to `/test/`.
- `/full/`: the full 25-question diagnostic, sent after sign-up. Not linked from the landing, not indexed.
- `/full/results/`: its result, in the Smart As style. Without a submitted attempt it sends the student to `/full/`.
- `/health`: the running commit.

## Files

- `site/js/questions.js`: picks the test by the page path (`/full/` or not): questions, storage key, URLs, section minutes.
- `site/js/questions-quick.js`, `site/js/questions-full.js`: questions: `sec`, `topic` (domain), `level`, `type`, `passage`, `prompt`, `choices`, `answer`, `explain`.
- `site/js/attempt.js`: the attempt in localStorage, key `pencilin-quick-v1` (quick test) or `pencilin-attempt-v1` (full test), named before the Smart As brand. Without localStorage it lives in `window.name` until the tab closes.
- `site/js/test.js`: test screen: timer, navigator, flags, cross-out, typed answer, section submit.
- `site/js/tools.js`: highlights and notes, reference sheet, calculator.
- `site/js/score.js`: scoring.
- `site/js/results.js`: result page.
- `site/js/waitlist.js`: waitlist letter to hello@bagira.study, subject «Smart As: November 30 practice SAT waitlist».
- `site/img/kid-hero.webp`, `kid-results.webp`, `kid-thinking.webp`, `kid-final.webp`: the «smart kid» drawings: first screen, result example, Questions, last block.
- `scripts/export-html.ts`: the landing, the quick test and its result as one HTML file. `/full/` is not in it.

## One-file site

- Build: `bun scripts/export-html.ts <out.html>`. The file is not committed.
- Pages by hash: `#/test/` the quick test, `#/results/` its result, anything else the landing. `#practice`, `#faq` stay landing anchors.
- Images are inside the file. Fonts load from Google Fonts; offline, system fonts.
- No bug report widget.
- The build fails if a `/test/` or `/results/` link is left unconverted.

## Sections

- Quick test: Reading and Writing, 5 easy questions, 3 minutes. Math, 5 easy questions, 2 minutes, one typed-in answer. The timer can be hidden except in the last minute.
- Full test: Reading and Writing, 12 questions, 14 minutes, 4 easy, 4 medium, 4 hard. Math, 13 questions, 21 minutes, 4 easy, 5 medium, 4 hard, two typed-in answers. The timer can be hidden except in the last 5 minutes.

## Scoring

- Score ranges: full test only. The quick test shows correct counts.
- Weights: easy 1, medium 2, hard 3.
- Section middle: 200 + 600 × weighted share correct, rounded to 10.
- Shown range: middle ± 40, kept within 200–800, marked «approximately».
- Total: correct answers out of 10 or 25.
- Domains: sorted weakest first.
- Weak spots: up to two domains with the lowest share correct.
