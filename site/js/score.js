// Scoring: correct counts, approximate section score range, domains weakest first, weak spots.
import { QUESTIONS } from "./questions.js";

export const SECTION_NAMES = { rw: "Reading & Writing", math: "Math" };
export const WEIGHT = { easy: 1, medium: 2, hard: 3 };
export const LETTERS = ["A", "B", "C", "D"];

// Position of a question inside its section (1-based) and the section's size.
export const inSection = q => QUESTIONS.filter(x => x.sec === q.sec);
export const numberInSection = q => inSection(q).indexOf(q) + 1;
export const questionLabel = q => `${SECTION_NAMES[q.sec]} question ${numberInSection(q)}`;

// "0.5", ".5", "1/2" -> number. null when it is not a number.
export function parseResponse(s) {
  s = String(s ?? "").trim();
  if (!s) return null;
  let m = s.match(/^(-?)(\d+)\/(\d+)$/);
  if (m) { const d = Number(m[3]); return d === 0 ? null : (m[1] ? -1 : 1) * Number(m[2]) / d; }
  m = s.match(/^-?(\d+\.?\d*|\.\d+)$/);
  return m ? Number(s) : null;
}

export const isAnswered = (q, a) => {
  const v = a.answers[q.n];
  return v !== undefined && v !== null && String(v) !== "";
};

export function isCorrect(q, a) {
  if (!isAnswered(q, a)) return false;
  const v = a.answers[q.n];
  if (q.type === "mc") return v === q.answer;
  const n = parseResponse(v);
  return n !== null && Math.abs(n - q.answer) < 1e-9;
}

const round10 = x => Math.round(x / 10) * 10;
export function scoreRange(share) {
  const mid = round10(200 + 600 * share);
  return { mid, low: Math.max(200, mid - 40), high: Math.min(800, mid + 40) };
}

export function grade(a) {
  const sections = {};
  for (const sec of ["rw", "math"]) {
    const qs = QUESTIONS.filter(q => q.sec === sec);
    const total = qs.reduce((t, q) => t + WEIGHT[q.level], 0);
    const earned = qs.reduce((t, q) => t + (isCorrect(q, a) ? WEIGHT[q.level] : 0), 0);
    const share = earned / total;
    sections[sec] = { name: SECTION_NAMES[sec], correct: qs.filter(q => isCorrect(q, a)).length, count: qs.length, share, ...scoreRange(share) };
  }
  const topics = [...new Set(QUESTIONS.map(q => q.topic))];
  const domains = topics.map(topic => {
    const qs = QUESTIONS.filter(q => q.topic === topic);
    const correct = qs.filter(q => isCorrect(q, a)).length;
    const missed = qs.filter(q => !isCorrect(q, a)).map(q => WEIGHT[q.level]);
    return { topic, sec: qs[0].sec, correct, count: qs.length, share: correct / qs.length, easiestMiss: missed.length ? Math.min(...missed) : Infinity };
  }).sort((x, y) => x.share - y.share || x.easiestMiss - y.easiestMiss);
  const weak = domains.filter(d => d.share < 1).slice(0, 2).map(d => d.topic);
  const total = QUESTIONS.filter(q => isCorrect(q, a)).length;
  return { sections, domains, weak, allCorrect: total === QUESTIONS.length, total };
}

export const rangeText = s => `approximately ${s.low}–${s.high}`;

// Text for the student's answer and the correct answer, for the review.
export function answerText(q, v) {
  if (v === undefined || v === null || v === "") return "No answer";
  return q.type === "mc" ? `${v}) ${q.choices[LETTERS.indexOf(v)]}` : String(v);
}
export const correctText = q => q.type === "mc" ? `${q.answer}) ${q.choices[LETTERS.indexOf(q.answer)]}` : String(q.answer);
