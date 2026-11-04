# Explanation: why the diagnostic works this way

The site is a prototype. It shows parents and students what preparation starts with, and collects a waitlist.

- No server. Pages and scripts are static files. Nothing is stored outside the student's browser.
- Bluebook look. Students meet the same tools on test day: timer, navigator, flags, cross-out, highlights, reference sheet and calculator.
- Own calculator. Desmos needs a paid licence for a website. Ours covers scientific keys and parentheses.
- The timer can be hidden, never turned off. It shows again for the last 5 minutes. Time runs from the section start, so closing the tab does not stop it.
- The landing offers a 5-minute quick test of 10 easy questions: a low bar to start. It shows correct counts only; ten easy questions give no SAT score.
- The full 25-question test is sent after sign-up, at `/full/`. 25 questions are still too few for a real score. Hence a range and the word «approximately». Hard questions weigh more, as in the adaptive SAT.
- The waitlist opens a letter instead of sending a form: a static site has nowhere to keep entries.

## The Smart As brand

- Smart As changed the brand and the landing design only. Structure, all text and the test stayed, as the task asked.
- The test keeps its Bluebook look: it copies the real exam screen, so a brand there would only get in the way. Only its header says Smart As.
- Two lines still say «Pencil in»: «Pencil in November 30» and «Pencil in your next step.». They are text, and the text stayed.
- The one-file site exists for review by people without the test site. Pages switch by hash because a file from disk has no server to serve `/test/`. Fonts stay on Google Fonts to keep the file small.
