// The student's attempt, kept in localStorage under one key. If storage throws, the attempt lives in memory
// (and is mirrored to window.name so a page change in the same tab, test -> results, does not lose it).
// Two tabs: the last opened tab owns the attempt. A tab id is written into the attempt on open and on every save.
export const KEY = "pencilin-attempt-v1";
export const tabId = Math.random().toString(36).slice(2) + Date.now().toString(36);

let mem = null;
let locked = false;
let lockListener = () => {};

function probe() {
  try {
    localStorage.setItem(KEY + "-probe", "1");
    localStorage.removeItem(KEY + "-probe");
    return true;
  } catch { return false; }
}
const storageOk = probe();
export const storageAvailable = () => storageOk;
export const isLocked = () => locked;

export function newAttempt() {
  return {
    v: 1, tab: tabId,
    answers: {},   // n -> "A".."D" or the typed string
    marks: {},     // n -> true
    strikes: {},   // n -> [choice indexes]
    notes: {},     // n -> [{id, s, e, text}]  highlight ranges over the passage text, with an optional note
    section: "rw", q: 1, review: false,
    starts: {},    // rw/math -> ms timestamp
    submitted: {}, // rw/math -> true
    timeUp: {},    // rw/math -> true when the timer submitted the section
  };
}

function readRaw() {
  if (storageOk) {
    try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  }
  try { return window.name.startsWith("pencilin:") ? JSON.parse(window.name.slice(9)) : null; } catch { return null; }
}

// Read the stored attempt (null if none). Does not claim the attempt for this tab.
export function peek() { return readRaw(); }

// Load the stored attempt into memory and claim it for this tab.
export function load() {
  mem = readRaw();
  if (mem) { locked = false; save(); }
  return mem;
}

export const get = () => mem;

export function create() {
  mem = newAttempt();
  locked = false;
  save();
  return mem;
}

export function save() {
  if (!mem || locked) return;
  mem.tab = tabId;
  const s = JSON.stringify(mem);
  if (storageOk) {
    try { localStorage.setItem(KEY, s); return; } catch { /* keep in memory */ }
  }
  window.name = "pencilin:" + s;
}

export function clear() {
  mem = null;
  try { localStorage.removeItem(KEY); } catch {}
  if (window.name.startsWith("pencilin:")) window.name = "";
}

// Called when another tab takes the attempt. This tab stops saving.
export function onLock(fn) { lockListener = fn; }

// "Continue here": take the attempt back from the other tab.
export function claim() {
  locked = false;
  return load();
}

window.addEventListener("storage", e => {
  if (e.key !== KEY || !e.newValue || !mem) return;
  let other;
  try { other = JSON.parse(e.newValue); } catch { return; }
  if (other && other.tab && other.tab !== tabId) { locked = true; lockListener(); }
});
