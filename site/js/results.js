// Results page: reads the submitted attempt, shows ranges, domains, weak spots and the review.
import { QUESTIONS } from "./questions.js";
import { peek, clear } from "./attempt.js";
import { grade, isAnswered, isCorrect, answerText, correctText, questionLabel, rangeText, SECTION_NAMES } from "./score.js";
import { mountWaitlist } from "./waitlist.js";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const a = peek();
if (!a || !a.submitted || !a.submitted.math) {
  location.replace("/test/");
} else {
  show(a);
}

function show(a) {
  const g = grade(a);
  const { rw, math } = g.sections;
  const secBlock = s => `<div class="bar-row"><div class="bar-label"><span>${s.name}</span><span>${s.correct} of ${s.count} correct</span></div>
    <div class="bar"><span style="width:${s.share * 100}%"></span></div>
    <p class="range" style="margin-top:8px"><b>${rangeText(s)}</b> out of 800</p></div>`;

  const weakHTML = g.allCorrect
    ? `<div class="start-here"><h3>Every question right</h3><p>Great start. There are no weak spots to name. A full-length practice SAT will tell you more about your pacing and the harder question types.</p></div>`
    : `<div class="start-here"><h3>Start here</h3><p>Your two weakest topics: <b>${g.weak.map(esc).join("</b> and <b>")}</b>. Read the explanations for these questions first, then practice similar problems this week.</p></div>`;

  const review = QUESTIONS.map(q => {
    const ok = isCorrect(q, a), ans = isAnswered(q, a);
    const yours = ans ? (q.type === "mc" ? answerText(q, a.answers[q.n]) : esc(a.answers[q.n])) : "No answer";
    const plain = q.prompt.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return `<details class="rev"><summary><span class="mark ${ok ? "ok" : ans ? "no" : "skip"}" aria-hidden="true">${ok ? "✓" : ans ? "✕" : "–"}</span>
      <span class="rev-title">${questionLabel(q)}: ${esc(plain.length > 80 ? plain.slice(0, 78) + "…" : plain)}<small>${esc(q.topic)}. ${ok ? "Correct" : ans ? "Incorrect" : "Not answered"}.</small></span></summary>
      <div class="rev-body">${q.passage ? `<div class="passage">${q.passage}</div>` : ""}<p>${q.prompt}</p>
      ${q.type === "mc" ? `<ol type="A" class="rev-choices">${q.choices.map(c => `<li>${c}</li>`).join("")}</ol>` : ""}
      <div class="ans-line"><span class="tag yours ${ok ? "ok" : ""}">Your answer: ${yours}</span>${ok ? "" : `<span class="tag correct">Correct answer: ${correctText(q)}</span>`}</div>
      <p class="explain">${esc(q.explain)}</p></div></details>`;
  }).join("");

  const timeNote = a.timeUp && (a.timeUp.rw || a.timeUp.math)
    ? `<p class="lede" style="color:var(--muted)">Time ran out in ${[a.timeUp.rw && SECTION_NAMES.rw, a.timeUp.math && SECTION_NAMES.math].filter(Boolean).join(" and ")}, so ${a.timeUp.rw && a.timeUp.math ? "those sections were" : "that section was"} submitted automatically with the answers you had entered.</p>` : "";

  document.querySelector("#results").innerHTML = `
    <h2>Your starting point</h2>
    ${timeNote}
    <div class="res-top">
      <div class="res-score">${g.total} <small>of 25</small></div>
      <div>${secBlock(rw)}${secBlock(math)}</div>
    </div>
    <p class="note" style="margin-top:0">The score ranges are approximate. Twenty-five questions give only a rough guide to the 200–800 section scores.</p>
    ${weakHTML}
    <div class="res-section">
      <h3>By topic, weakest first</h3>
      ${g.domains.map(d => `<div class="bar-row"><div class="bar-label"><span>${esc(d.topic)}</span><span>${d.correct} of ${d.count}</span></div><div class="bar ${d.share < .6 ? "low" : ""}"><span style="width:${d.share * 100}%"></span></div></div>`).join("")}
    </div>
    <div class="next-step">
      <h3>Next step: the full-length practice SAT on November 30</h3>
      <p>${g.allCorrect ? "You got every question right, so a complete practice SAT is the best next step." : "Twenty-five questions point you in a direction. A complete test shows where you stand."} Join the waitlist and your result goes into the email.</p>
      <div class="wl-card"><div data-wl="results"></div></div>
    </div>
    <div class="res-section">
      <h3>Every question, explained</h3>
      ${review}
    </div>
    <p class="note">This diagnostic uses original SAT-style questions. The score ranges are approximate.</p>
    <div class="btn-row" style="margin-top:28px">
      <button class="btn btn-primary" id="retake">Retake the test</button>
      <a class="btn btn-ghost" href="/">Back to the home page</a>
    </div>`;

  mountWaitlist(document.querySelector("[data-wl]"), () => {
    const lines = ["My free diagnostic result (approximate):",
      `${rw.name}: ${rangeText(rw)} (${rw.correct} of ${rw.count} correct)`,
      `${math.name}: ${rangeText(math)} (${math.correct} of ${math.count} correct)`];
    lines.push(g.allCorrect ? "Weak domains: none, all questions correct" : `Weak domains: ${g.weak.join("; ")}`);
    return lines.join("\n");
  });
  document.querySelector("#retake").addEventListener("click", () => { clear(); location.href = "/test/"; });
}
