// The test screen: start, two timed sections, Check Your Work, section break. Look follows docs/designs/test-screen-mockup.html (option A).
import { QUESTIONS, TEST } from "./questions.js";
import * as At from "./attempt.js";
import { selectionIn, addHighlight, applyHighlights, makeDraggable, REFERENCE_HTML, mountCalculator } from "./tools.js";
import { isAnswered, LETTERS } from "./score.js";

const SEC = {
  rw: { title: "Section 1: Reading and Writing", name: "Reading and Writing", limit: TEST.minutes.rw * 60000 },
  math: { title: "Section 2: Math", name: "Math", limit: TEST.minutes.math * 60000 },
};
const WARN_MS = TEST.warnMinutes * 60000;
const qsOf = sec => QUESTIONS.filter(q => q.sec === sec);
const minutes = n => `${n} minute${n === 1 ? "" : "s"}`;
const lastMinutes = TEST.warnMinutes === 1 ? "the last minute" : `the last ${TEST.warnMinutes} minutes`;
const $ = s => document.querySelector(s);
const app = $("#app");
const calcPanel = $("#calc"), refPanel = $("#ref"), noteBox = $("#noteBox"), overlay = $("#overlay"), dialog = $("#dialog");

let a = null;
const ui = { navOpen: false, dirOpen: false, hlOpen: false, strikeOn: false, timerHidden: false, calcOpen: false, refOpen: false, split: 50, sprHint: "", noteId: null };

const ICON = {
  pencil: `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 17l-1 4 4-1L20 8l-3-3Z M14 8l3 3 M4 23h16"/></svg>`,
  calc: `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5" y="2" width="15" height="21" rx="2"/><path d="M8 6h9M8 11h2m4 0h3M8 15h2m4 0h3M8 19h2m4 0h3"/></svg>`,
  book: `<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 4h8l2 2 2-2h8v17h-8l-2 2-2-2H3Z M13 6v17"/></svg>`,
};

/* ---------- state ---------- */
function screen() {
  if (!a) return "start";
  if (a.submitted.math) return "done";
  if (a.submitted.rw && !a.starts.math) return "break";
  return a.review ? "review" : "question";
}
const curSec = () => (a.submitted.rw ? "math" : "rw");
const curQ = () => QUESTIONS.find(q => q.n === a.q);
const remaining = sec => SEC[sec].limit - (Date.now() - a.starts[sec]);
const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const answered = q => isAnswered(q, a);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- templates ---------- */
function plainTop(right = `${QUESTIONS.length}-question ${TEST.full ? "diagnostic" : "quick test"}`) {
  return `<header class="top plain"><div class="wordmark">Pencil In</div><span class="sub">${right}</span></header>`;
}

const DIRECTIONS = {
  rw: `<p>The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).</p><p>All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.</p>`,
  math: `<p>The questions in this section address a number of important math skills. Use of a calculator is permitted for all questions. A reference sheet, calculator, and these directions can be accessed throughout the test.</p><p>Unless otherwise indicated, all variables and expressions represent real numbers, figures are drawn to scale, and the domain of a function is all real numbers for which the function is a real number.</p><p>For multiple-choice questions, solve each problem and choose the correct answer from the choices provided. Each has a single correct answer. For student-produced response questions, solve each problem and enter your answer in the field provided.</p>`,
};

function topbar() {
  const sec = curSec();
  const hl = a.notes[a.q] || [];
  const tools = sec === "rw"
    ? `<button class="tool${ui.hlOpen ? " on" : ""}" data-act="hl">${ICON.pencil}Highlights &amp; Notes</button>`
    : `<button class="tool${ui.calcOpen ? " on" : ""}" data-act="calc" aria-pressed="${ui.calcOpen}">${ICON.calc}Calculator</button>
       <button class="tool${ui.refOpen ? " on" : ""}" data-act="ref" aria-pressed="${ui.refOpen}">${ICON.book}Reference</button>`;
  const hlPanel = sec === "rw" && ui.hlOpen && screen() === "question" ? `<div class="dropdown hlpanel">
      <h3>Highlights &amp; Notes</h3>
      <p>Select text in the passage to highlight it. Click a highlight to add a note.</p>
      ${hl.length ? `<ul>${hl.map(h => `<li><button data-act="hl-item" data-id="${h.id}"><span class="hl-text">${esc(passageText().slice(h.s, h.e))}</span>${h.text ? `<span class="hl-note">${esc(h.text)}</span>` : ""}</button></li>`).join("")}</ul>` : `<p class="muted">No highlights on this question.</p>`}
    </div>` : "";
  return `<header class="top">
    <div><div class="section">${SEC[sec].title}</div><button class="directions" data-act="dir" aria-expanded="${ui.dirOpen}">Directions ${ui.dirOpen ? "⌃" : "⌄"}</button></div>
    <div class="timer"><span class="time" id="time"></span><button class="timer-toggle" id="timerBtn" data-act="timer"></button></div>
    <div class="tools">${tools}</div>
    ${ui.dirOpen ? `<div class="dropdown dirpanel">${DIRECTIONS[sec]}</div>` : ""}
    ${hlPanel}
  </header>`;
}
const passageText = () => { const q = curQ(); const d = document.createElement("div"); d.innerHTML = q.passage || ""; return d.textContent; };

function qhead(q, idx) {
  const marked = !!a.marks[q.n];
  return `<div class="qhead"><span class="number">${idx}</span>
    <button class="mark${marked ? " on" : ""}" data-act="mark" aria-pressed="${marked}"><span class="bookmark"></span>Mark for Review</button>
    ${q.type === "mc" ? `<button class="abc${ui.strikeOn ? " on" : ""}" data-act="abc" aria-pressed="${ui.strikeOn}" aria-label="Answer elimination">ABC</button>` : ""}</div>`;
}

function choicesHTML(q) {
  const strikes = a.strikes[q.n] || [];
  return `<div class="choices">${q.choices.map((c, i) => {
    const L = LETTERS[i], struck = strikes.includes(i), sel = a.answers[q.n] === L;
    return `<div class="choice-row"><button class="choice${sel ? " selected" : ""}${struck ? " struck" : ""}" data-act="choice" data-i="${i}" aria-pressed="${sel}"><span class="letter">${L}</span><span class="answer">${c}</span></button>${
      ui.strikeOn || struck ? `<button class="cross${struck ? " on" : ""}" data-act="cross" data-i="${i}" aria-label="${struck ? "Undo cross out of" : "Cross out"} choice ${L}" aria-pressed="${struck}">${L}</button>` : ""}</div>`;
  }).join("")}</div>`;
}

function sprHTML(q) {
  const v = a.answers[q.n] ?? "";
  return `<label class="sr" for="sprIn">Your answer</label>
    <input class="entry${ui.sprHint ? " invalid" : ""}" id="sprIn" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="text" aria-describedby="sprHint" value="${esc(v)}">
    <p class="hint" id="sprHint" role="alert">${esc(ui.sprHint)}</p>
    <p class="preview">Answer Preview: <strong id="sprPrev">${esc(v)}</strong></p>`;
}

function questionBody() {
  const q = curQ(), sec = q.sec, idx = qsOf(sec).indexOf(q) + 1;
  if (sec === "rw") {
    return `<div class="body rw" id="body" style="--split:${ui.split}%">
      <article class="passage" id="passage">${q.passage}</article>
      <div class="divider" id="divider" role="separator" aria-orientation="vertical"><span class="handle">⋮</span></div>
      <div class="question">${qhead(q, idx)}<p class="stem">${q.prompt}</p>${choicesHTML(q)}</div>
    </div>`;
  }
  const spr = q.type === "spr";
  return `<div class="body math${ui.calcOpen || ui.refOpen ? " with-panel" : ""}" id="body"><div class="math-wrap">
    ${spr ? `<aside class="response-help"><h3>Student-produced<br>response directions</h3><p>Enter your answer as a fraction or decimal.</p><p>Use up to 5 characters for a positive answer or 6 for a negative answer.</p><p>Do not enter a mixed number. Enter an improper fraction or its decimal equivalent.</p></aside>` : ""}
    <div class="math-question${spr ? " response-question" : ""}">${qhead(q, idx)}<p class="stem">${q.prompt}</p>${spr ? sprHTML(q) : choicesHTML(q)}</div>
  </div></div>`;
}

function gridHTML(sec, big) {
  return `<div class="grid${big ? " big" : ""}">${qsOf(sec).map((q, i) => {
    const cur = screen() === "question" && q.n === a.q, ans = answered(q), flag = !!a.marks[q.n];
    return `<button class="cell${ans ? " answered" : ""}${cur ? " current" : ""}${flag ? " flagged" : ""}" data-act="goto" data-n="${q.n}" aria-label="Question ${i + 1}${ans ? "" : ", unanswered"}${flag ? ", for review" : ""}">${i + 1}</button>`;
  }).join("")}</div>`;
}
const LEGEND = `<div class="legend"><span><b class="cur">▼</b> Current</span><span><i class="empty-icon"></i> Unanswered</span><span><b class="flag">⚑</b> For Review</span></div>`;

function navigator() {
  const sec = curSec();
  return `<aside class="navigator" role="dialog" aria-label="Question navigator"><button class="close" data-act="navclose" aria-label="Close navigator">×</button>
    <h3 class="navtitle">${SEC[sec].title} Questions</h3>${LEGEND}${gridHTML(sec)}
    <button class="review-btn" data-act="review">Go to Review Page</button></aside>`;
}

function bottom(mid, actions) {
  return `<footer class="bottom"><span class="student">Student</span>${mid}<div class="actions">${actions}</div></footer>`;
}

function view() {
  const sc = screen();
  if (sc === "start") {
    const warn = At.storageAvailable() ? "" : `<p class="storage-warn" role="alert"><strong>Your progress can't be saved in this browser.</strong> Keep this tab open. If you close or reload it, you will have to start again.</p>`;
    return plainTop() + `<div class="center"><div class="break-content start">
      <h2>Before you start</h2>
      <ul class="rules">
        <li><b>Two sections.</b> Reading and Writing: ${qsOf("rw").length} questions, ${minutes(TEST.minutes.rw)}. Then Math: ${qsOf("math").length} questions, ${minutes(TEST.minutes.math)}. ${minutes(TEST.minutes.rw + TEST.minutes.math)} in total.</li>
        <li><b>The timer always runs.</b> You can hide it, but it comes back for ${lastMinutes}. When time runs out, your section is submitted with the answers you entered.</li>
        <li><b>Tools.</b> Mark questions for review and cross out answers with ABC. Highlight and add notes in reading passages. In Math, use the scientific calculator and the reference sheet.</li>
        <li><b>No going back.</b> You can move between questions inside a section. After you submit a section, you can't return to it.</li>
        <li><b>Progress is saved</b> in this browser. If you close the tab, come back and the clock keeps counting.</li>
      </ul>${warn}
      <button class="primary" data-act="start">Start the test</button></div></div>` + bottom("", "");
  }
  if (sc === "break") {
    return plainTop() + `<div class="center"><div class="break-content"><div class="checkmark">✓</div>
      <h2>Reading and Writing submitted.</h2>
      ${a.timeUp.rw ? `<p class="detail up">Time ran out, so this section was submitted automatically.</p>` : ""}
      <p>Next: Math — ${qsOf("math").length} questions, ${minutes(TEST.minutes.math)}.</p><p class="detail">Calculator and reference sheet available.</p>
      <button class="primary" data-act="startmath">Start Math</button></div></div>` + bottom("", "");
  }
  if (sc === "done") {
    return plainTop() + `<div class="center"><div class="break-content"><div class="checkmark">✓</div>
      <h2>You have finished the test.</h2><p>Your results are ready.</p>
      <div class="two"><a class="primary" href="${TEST.resultsUrl}">See your results</a><button class="back" data-act="retake">Retake the test</button></div></div></div>` + bottom("", "");
  }
  const sec = curSec(), list = qsOf(sec), q = curQ(), idx = list.indexOf(q) + 1;
  const pill = `<button class="navtoggle" data-act="nav" aria-expanded="${ui.navOpen}">Question ${sc === "review" ? list.length : idx} of ${list.length} ${ui.navOpen ? "⌄" : "⌃"}</button>`;
  if (sc === "review") {
    return topbar() + `<div class="review"><h2>Check Your Work</h2>
      <p>You can still go back to any question. When you submit, you can't return to this section.</p>
      <h3>${SEC[sec].title} Questions</h3>${LEGEND}${gridHTML(sec, true)}</div>` +
      bottom("", `<button class="back" data-act="back">Back</button><button class="primary" data-act="submit">Submit section</button>`) + (ui.navOpen ? navigator() : "");
  }
  const last = idx === list.length;
  return topbar() + questionBody() +
    bottom(pill, `${idx > 1 ? `<button class="back" data-act="back">Back</button>` : ""}<button class="primary" data-act="next">Next</button>`) + (ui.navOpen ? navigator() : "");
}

/* ---------- render ---------- */
function render(keep) {
  closeNote();
  const saved = keep ? [...app.querySelectorAll(".passage,.question,.body,.review")].map(e => [e.className, e.scrollTop]) : [];
  app.innerHTML = view();
  saved.forEach(([c, t]) => { const e = app.querySelector("." + c.split(" ").join(".")); if (e) e.scrollTop = t; });
  const sc = screen();
  const inMath = (sc === "question" || sc === "review") && curSec() === "math";
  calcPanel.hidden = !(inMath && ui.calcOpen);
  refPanel.hidden = !(inMath && ui.refOpen);
  if (!calcPanel.style.left) calcPanel.style.right = ui.refOpen ? "480px" : "";
  if (sc === "question" && curSec() === "rw") {
    const p = $("#passage");
    applyHighlights(p, a.notes[a.q] || []);
    p.querySelectorAll("mark").forEach(m => { const h = (a.notes[a.q] || []).find(x => x.id === m.dataset.id); if (h && h.text) m.classList.add("has-note"); });
  }
  updateTimer();
}

function updateTimer() {
  const t = $("#time"), b = $("#timerBtn");
  if (!t || !a) return;
  const rem = remaining(curSec());
  const forced = rem <= WARN_MS;
  const hide = ui.timerHidden && !forced;
  t.hidden = hide;
  t.textContent = fmt(rem);
  t.classList.toggle("warn", forced);
  b.textContent = hide ? "◷ Show" : "Hide";
  b.disabled = forced;
  b.title = forced ? `The timer stays visible for ${lastMinutes}` : "";
}

/* ---------- timer ---------- */
function tick() {
  if (!a || At.isLocked()) return;
  const sc = screen();
  if (sc !== "question" && sc !== "review") return;
  const sec = curSec();
  if (remaining(sec) <= 0) { timeUp(sec); return; }
  updateTimer();
}
setInterval(tick, 250);
document.addEventListener("visibilitychange", tick);

function timeUp(sec) {
  submitSection(sec, true);
  dialog.innerHTML = `<h2>Time's up</h2><p>${sec === "rw" ? "Your Reading and Writing answers were submitted." : "Your Math answers were submitted."}</p>`;
  overlay.hidden = false;
  render();
  setTimeout(() => { overlay.hidden = true; if (sec === "math") location.href = TEST.resultsUrl; }, 2200);
}

function submitSection(sec, byTimer) {
  a.submitted[sec] = true;
  if (byTimer) a.timeUp[sec] = true;
  a.review = false;
  ui.navOpen = false; ui.dirOpen = false; ui.hlOpen = false;
  At.save();
}

/* ---------- actions ---------- */
function goto(n) {
  a.q = n; a.review = false;
  ui.navOpen = false; ui.strikeOn = false; ui.sprHint = ""; ui.hlOpen = false;
  At.save(); render();
  $(".question, .math-question")?.scrollTo?.(0, 0);
}

const actions = {
  start() {
    a = At.create();
    a.starts.rw = Date.now(); a.section = "rw"; a.q = 1;
    At.save(); render();
  },
  startmath() {
    a.starts.math = Date.now(); a.section = "math"; a.q = qsOf("math")[0].n; a.review = false;
    ui.navOpen = false;
    At.save(); render();
  },
  retake() { At.clear(); location.href = TEST.testUrl; },
  dir() { ui.dirOpen = !ui.dirOpen; ui.hlOpen = false; render(true); },
  hl() { ui.hlOpen = !ui.hlOpen; ui.dirOpen = false; render(true); },
  "hl-item"(el) {
    ui.hlOpen = false; render(true);
    const m = $(`#passage mark[data-id="${el.dataset.id}"]`);
    if (m) { m.scrollIntoView({ block: "center" }); openNote(el.dataset.id); }
  },
  timer() {
    if (remaining(curSec()) <= WARN_MS) return;
    ui.timerHidden = !ui.timerHidden; updateTimer();
  },
  calc() { ui.calcOpen = !ui.calcOpen; if (ui.calcOpen) { raise(calcPanel); } render(true); if (ui.calcOpen) calcPanel.focus(); },
  ref() { ui.refOpen = !ui.refOpen; if (ui.refOpen) raise(refPanel); render(true); },
  mark() { const n = a.q; if (a.marks[n]) delete a.marks[n]; else a.marks[n] = true; At.save(); render(true); },
  abc() { ui.strikeOn = !ui.strikeOn; render(true); },
  choice(el) {
    const q = curQ(), i = Number(el.dataset.i);
    const st = a.strikes[q.n] || [];
    if (st.includes(i)) a.strikes[q.n] = st.filter(x => x !== i);
    a.answers[q.n] = LETTERS[i];
    At.save(); render(true);
  },
  cross(el) {
    const q = curQ(), i = Number(el.dataset.i);
    const st = a.strikes[q.n] || [];
    if (st.includes(i)) a.strikes[q.n] = st.filter(x => x !== i);
    else {
      a.strikes[q.n] = [...st, i];
      if (a.answers[q.n] === LETTERS[i]) delete a.answers[q.n];
    }
    At.save(); render(true);
  },
  back() {
    if (a.review) { goto(qsOf(curSec()).at(-1).n); return; }
    const list = qsOf(curSec()), i = list.indexOf(curQ());
    if (i > 0) goto(list[i - 1].n);
  },
  next() {
    const list = qsOf(curSec()), i = list.indexOf(curQ());
    if (i < list.length - 1) goto(list[i + 1].n);
    else { a.review = true; ui.navOpen = false; ui.sprHint = ""; At.save(); render(); }
  },
  nav() { ui.navOpen = !ui.navOpen; render(true); },
  navclose() { ui.navOpen = false; render(true); },
  review() { a.review = true; ui.navOpen = false; At.save(); render(); },
  goto(el) { goto(Number(el.dataset.n)); },
  submit() {
    const sec = curSec();
    submitSection(sec, false);
    if (sec === "math") location.href = TEST.resultsUrl; else render();
  },
};

app.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (el && actions[el.dataset.act]) { actions[el.dataset.act](el); return; }
  const m = e.target.closest("#passage mark");
  if (m && getSelection().isCollapsed) { openNote(m.dataset.id); return; }
  if (ui.navOpen && !e.target.closest(".navigator")) { ui.navOpen = false; render(true); }
});

/* ---------- grid-in input ---------- */
function sprProblem(v) {
  if (!/^[0-9./-]*$/.test(v)) return "Use only digits, a minus sign at the start, and one decimal point or one fraction slash.";
  if (v.lastIndexOf("-") > 0 || (v.match(/-/g) || []).length > 1) return "A minus sign can only go at the start.";
  if ((v.match(/\./g) || []).length > 1 || (v.match(/\//g) || []).length > 1 || (v.includes(".") && v.includes("/"))) return "Use one decimal point or one fraction slash, not both.";
  if (v.length > (v[0] === "-" ? 6 : 5)) return "Use up to 5 characters, or 6 with a minus sign.";
  return "";
}
app.addEventListener("input", e => {
  if (e.target.id !== "sprIn") return;
  const inp = e.target, q = curQ(), v = inp.value.trim();
  const problem = sprProblem(v);
  const hint = $("#sprHint");
  if (problem) {
    inp.value = a.answers[q.n] ?? "";
    ui.sprHint = problem;
  } else {
    ui.sprHint = "";
    if (v) a.answers[q.n] = v; else delete a.answers[q.n];
    At.save();
  }
  hint.textContent = ui.sprHint;
  inp.classList.toggle("invalid", !!ui.sprHint);
  $("#sprPrev").textContent = a.answers[q.n] ?? "";
});

/* ---------- highlights and notes ---------- */
app.addEventListener("pointerup", e => {
  if (!e.target.closest("#passage")) return;
  setTimeout(() => {
    const p = $("#passage");
    if (!p) return;
    const s = selectionIn(p);
    if (!s) return;
    const { list, added } = addHighlight(a.notes[a.q] || [], s.s, s.e);
    a.notes[a.q] = list;
    At.save();
    getSelection().removeAllRanges();
    render(true);
    openNote(added.id);
  }, 0);
});

function openNote(id) {
  const m = $(`#passage mark[data-id="${id}"]`);
  const h = (a.notes[a.q] || []).find(x => x.id === id);
  if (!m || !h) return;
  ui.noteId = id;
  noteBox.querySelector("textarea").value = h.text || "";
  noteBox.hidden = false;
  const r = m.getBoundingClientRect(), w = noteBox.offsetWidth;
  noteBox.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px";
  noteBox.style.top = Math.min(r.bottom + 8, innerHeight - noteBox.offsetHeight - 8) + "px";
  noteBox.querySelector("textarea").focus();
}
function closeNote() { ui.noteId = null; noteBox.hidden = true; }
noteBox.addEventListener("click", e => {
  const act = e.target.closest("[data-note]")?.dataset.note;
  if (!act || !ui.noteId) return;
  const list = a.notes[a.q] || [];
  if (act === "save") {
    const h = list.find(x => x.id === ui.noteId);
    if (h) h.text = noteBox.querySelector("textarea").value.trim();
  } else a.notes[a.q] = list.filter(x => x.id !== ui.noteId);
  At.save(); render(true);
});
document.addEventListener("pointerdown", e => {
  if (!noteBox.hidden && !e.target.closest("#noteBox") && !e.target.closest("#passage mark")) closeNote();
});
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!noteBox.hidden) closeNote();
  else if (ui.navOpen) { ui.navOpen = false; render(true); }
});

/* ---------- divider ---------- */
app.addEventListener("pointerdown", e => {
  const d = e.target.closest("#divider");
  if (!d) return;
  const body = $("#body"), box = body.getBoundingClientRect();
  d.setPointerCapture(e.pointerId);
  const move = ev => {
    ui.split = Math.min(75, Math.max(25, (ev.clientX - box.left) / box.width * 100));
    body.style.setProperty("--split", ui.split + "%");
  };
  const up = () => { d.removeEventListener("pointermove", move); d.removeEventListener("pointerup", up); };
  d.addEventListener("pointermove", move); d.addEventListener("pointerup", up);
  e.preventDefault();
});

/* ---------- panels ---------- */
let z = 20;
function raise(p) { p.style.zIndex = ++z; }
mountCalculator($("#calcBody"));
$("#refBody").innerHTML = REFERENCE_HTML;
calcPanel.addEventListener("pointerdown", () => raise(calcPanel));
refPanel.addEventListener("pointerdown", () => raise(refPanel));
makeDraggable(calcPanel, calcPanel.querySelector(".panel-title"));
makeDraggable(refPanel, refPanel.querySelector(".panel-title"));
calcPanel.querySelector("[data-close]").addEventListener("click", () => { ui.calcOpen = false; render(true); });
refPanel.querySelector("[data-close]").addEventListener("click", () => { ui.refOpen = false; render(true); });

/* ---------- other tab ---------- */
At.onLock(() => {
  dialog.innerHTML = `<h2>This test is open in another tab</h2><p>Only one tab can run the test at a time. Continue here to take it over; the other tab will stop.</p><button class="primary" id="takeover">Continue here</button>`;
  overlay.hidden = false;
  $("#takeover").addEventListener("click", () => {
    a = At.claim();
    overlay.hidden = true;
    render();
  });
});

/* ---------- init ---------- */
a = At.load();
if (a && screen() === "done") { /* finished attempt: show the done screen */ }
render();
if (a && (screen() === "question" || screen() === "review")) tick();
