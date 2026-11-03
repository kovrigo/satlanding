# Reference: pages, files and scoring

## Pages

- `/`: landing from the design, «Try one now» sample, waitlist form.
- `/test/`: the diagnostic in the Bluebook style.
- `/results/`: the result. Without a submitted attempt it sends the student to `/test/`.
- `/health`: the running commit.

## Files

- `site/js/questions.js`: questions: section, domain, level, text, choices or typed answer, answer, explanation.
- `site/js/attempt.js`: the attempt in localStorage, key `pencilin-attempt-v1`. Without localStorage it lives in `window.name` until the tab closes.
- `site/js/test.js`: test screen: timer, navigator, flags, cross-out, typed answer, section submit.
- `site/js/tools.js`: highlights and notes, reference sheet, calculator.
- `site/js/score.js`: scoring.
- `site/js/results.js`: result page.
- `site/js/waitlist.js`: waitlist letter to hello@bagira.study.

## Sections

- Reading and Writing: 12 questions, 14 minutes. 4 easy, 4 medium, 4 hard.
- Math: 13 questions, 21 minutes. 4 easy, 5 medium, 4 hard. Two typed-in answers.

## Scoring

- Weights: easy 1, medium 2, hard 3.
- Section middle: 200 + 600 × weighted share correct, rounded to 10.
- Shown range: middle ± 40, kept within 200–800, marked «approximately».
- Total range: sum of the section ranges.
- Weak spots: the domains with the lowest share correct.
