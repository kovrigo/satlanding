# Smart As landing — option B: "Arcade brutal"

## Style direction

Loud neo-brutalist web meets a retro arcade game. Saturated flat colour
blocks, thick 3px black outlines, hard black offset shadows (no blur), square
corners. Buttons press down on hover like arcade buttons. The example results
card looks like a game score screen with chunky segmented bars; the four
program phases look like level tiles; the 25 answer-sheet bubbles look like
pixel tiles. Big numbers (25, 35, 98, 18) are huge. Visual game metaphors
only: no new words such as "Level" or "XP".

Suggested tokens: background electric blue #3B2BFF (text on it white),
surface white cards with black text, text #0A0A0A, one accent: acid yellow
#FFE600. Fonts: a fat display face for headings and logo (e.g. Archivo Black
or Rubik Mono One), a monospace or grotesque for body (e.g. Space Mono or
Space Grotesk; body must stay comfortable to read). Pick your own if they
serve the direction better.

## Product

Smart As: a new brand for an existing SAT landing page (old brand: Pencil In).
Brand character: bright, cheeky, a bit of a hooligan. Audience: teenagers in
grades 9-12 thinking about the SAT, plus their parents.

The task changes only the brand and the visual design of the landing page.
Structure and copy stay exactly as they are. The test pages are out of scope:
do not design them.

## Language

Every visible text is in **English**, copied verbatim from the current page.
The person wrote the request in Russian, but they asked explicitly to keep
the real Pencil In text. Never translate it. Never rewrite, shorten or add
copy. Decorative marks may be drawings, never new words.

## Content source

Copy every visible text, in this order, from the current landing page:
`/srv/projects/sat-landing/worktrees/smart-as-work/site/index.html`
(the `#landing` block). The waitlist form markup and its letter preview
come from `site/js/waitlist.js` in the same worktree (`mountWaitlist`):
render them statically inside the waitlist card, with the letter preview
filled as `refresh()` would fill it with an empty form.

Only change:
- the brand name in the logo: wordmark "Smart As" instead of "pencil in"
  (design a new logo mark that fits your direction; no pencil);
- the `<title>`: "Smart As — Find your SAT starting point".

Keep everything else verbatim, including "Pencil in November 30" (waitlist
card heading) and "Pencil in your next step." (footer line): they are plain
English phrases, not the brand.

Sections, in order (keep all of them):
1. Announcement bar.
2. Header: logo, nav (4 links), "Take the free test" button.
3. Hero: H1, lede, two buttons, meta line, and the "Try one now" question
   card with four choices A-D. Make it work: clicking a choice shows the
   right/wrong feedback text exactly as the page's script does (C is right).
4. "Three steps to a clear plan": three steps.
5. "What's on the test": answer-sheet row of 25 numbered bubbles
   (1-12 Reading & Writing, 13-25 Math, two visual styles), its legend,
   two halves with four topics each and their counts.
6. "Feels like the real thing": four features.
7. "What you see at the end": four checklist items and the example results
   card (18 of 25 correct, four bars, "Start here" tip).
8. "A year-long program, starting November 30": four phases, button, note.
9. "Full-length practice SAT on November 30" (#practice): text, facts list,
   waitlist card with the form and the letter preview.
10. "Who it's for": Students, Parents.
11. "Questions": six FAQ items as working `<details>`.
12. Final call to action: heading, line, two buttons.
13. Footer: logo, line, disclaimer.

Links: the test buttons point to `#`; anchor links keep their anchors.

## Layout

Design for a 1440px-wide desktop screen; it must also work at 390px wide
with no horizontal scroll. Readable body text (at least 17px on desktop).
Buttons and form controls must look clickable. Keep contrast readable.
