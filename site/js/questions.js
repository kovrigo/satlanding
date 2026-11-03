// Two tests share the test and results screens. The page's path picks one:
// the quick test of the landing page (/test/, /results/) or the full test sent after sign-up (/full/, /full/results/).
import { QUICK } from "./questions-quick.js";
import { FULL } from "./questions-full.js";

const full = location.pathname.startsWith("/full/");

export const TEST = full
  ? { full, key: "pencilin-attempt-v1", testUrl: "/full/", resultsUrl: "/full/results/", minutes: { rw: 14, math: 21 }, warnMinutes: 5 }
  : { full, key: "pencilin-quick-v1", testUrl: "/test/", resultsUrl: "/results/", minutes: { rw: 3, math: 2 }, warnMinutes: 1 };

export const QUESTIONS = full ? FULL : QUICK;
QUESTIONS.forEach((q, i) => (q.n = i + 1));
