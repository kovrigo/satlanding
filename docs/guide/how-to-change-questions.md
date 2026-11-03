# How to change or add a question

The quick test's 10 questions live in `site/js/questions-quick.js`, the full test's 25 in `site/js/questions-full.js`. No build step: save the file and reload.

1. Find the question by `sec` (`rw` or `math`) and its order in the list.
2. Edit `passage`, `prompt`, `choices`, `answer` and `explain`.
3. Keep `topic` one of the SAT domains and `level` one of `easy`, `medium`, `hard`.
4. A typed-in Math answer has `type:"spr"` and no `choices`; `answer` is the number, written as the student may type it.
5. Keep the section order easy to hard. The test screen shows the questions in file order.
6. Open `/test/` (quick) or `/full/` (full), answer the changed question, submit, and check its line on the result page.

Section minutes are in `TEST` in `site/js/questions.js`. The landing's counts and topic lists in `site/index.html` are written by hand: update them with the quick test.
