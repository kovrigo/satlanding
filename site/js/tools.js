// Test tools: passage highlights, reference sheet, scientific calculator, draggable panels.

/* ---------- highlights ---------- */
function textNodes(root) {
  const out = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n);
  return out;
}

// Character offset of a DOM point inside root's text.
export function offsetIn(root, node, off) {
  const r = document.createRange();
  r.selectNodeContents(root);
  r.setEnd(node, off);
  return r.toString().length;
}

// Offsets of the current selection inside root, or null.
export function selectionIn(root) {
  const sel = getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return null;
  let s = offsetIn(root, r.startContainer, r.startOffset);
  let e = offsetIn(root, r.endContainer, r.endOffset);
  const text = root.textContent;
  while (s < e && /\s/.test(text[s])) s++;
  while (e > s && /\s/.test(text[e - 1])) e--;
  return e > s ? { s, e } : null;
}

// Add a highlight; ranges it overlaps are merged into it (the first note is kept).
export function addHighlight(list, s, e) {
  const hit = list.filter(h => h.s <= e && h.e >= s);
  const keep = list.filter(h => !hit.includes(h));
  const merged = {
    id: "h" + Math.random().toString(36).slice(2, 8),
    s: Math.min(s, ...hit.map(h => h.s)), e: Math.max(e, ...hit.map(h => h.e)),
    text: (hit.find(h => h.text) || {}).text || "",
  };
  keep.push(merged);
  return { list: keep, added: merged };
}

// Wrap each highlight range in <mark data-id>.
export function applyHighlights(root, list) {
  const nodes = textNodes(root);
  let pos = 0;
  const segs = [];
  for (const node of nodes) {
    const len = node.data.length;
    for (const h of list) {
      const a = Math.max(h.s, pos), b = Math.min(h.e, pos + len);
      if (a < b) segs.push({ node, a: a - pos, b: b - pos, id: h.id });
    }
    pos += len;
  }
  for (const g of segs.reverse()) {
    const r = document.createRange();
    r.setStart(g.node, g.a); r.setEnd(g.node, g.b);
    const m = document.createElement("mark");
    m.dataset.id = g.id;
    r.surroundContents(m);
  }
}

/* ---------- draggable panels ---------- */
export function makeDraggable(panel, handle) {
  let sx, sy, ox, oy, drag = false;
  handle.style.touchAction = "none";
  handle.addEventListener("pointerdown", e => {
    if (e.target.closest("button") || matchMedia("(max-width:700px)").matches) return;
    const r = panel.getBoundingClientRect();
    drag = true; sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener("pointermove", e => {
    if (!drag) return;
    const x = Math.min(Math.max(0, ox + e.clientX - sx), innerWidth - 80);
    const y = Math.min(Math.max(0, oy + e.clientY - sy), innerHeight - 60);
    panel.style.left = x + "px"; panel.style.top = y + "px"; panel.style.right = "auto";
  });
  const end = () => { drag = false; };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
}

/* ---------- reference sheet ---------- */
export const REFERENCE_HTML = `<div class="formulas">
<div class="formula"><div class="formula-name">Circle</div><svg viewBox="0 0 105 65" aria-label="Circle"><circle cx="52" cy="30" r="24"/><path d="M52 30h24"/><text x="59" y="26">r</text></svg>A = πr²<br>C = 2πr</div>
<div class="formula"><div class="formula-name">Rectangle</div><svg viewBox="0 0 105 65" aria-label="Rectangle"><path d="M15 12h75v37H15Z"/><text x="50" y="60">l</text><text x="94" y="34">w</text></svg>A = lw</div>
<div class="formula"><div class="formula-name">Triangle</div><svg viewBox="0 0 105 65" aria-label="Triangle"><path d="M12 49L52 8l40 41Z M52 8v41"/><text x="56" y="34">h</text><text x="49" y="60">b</text></svg>A = ½bh</div>
<div class="formula"><div class="formula-name">Right triangle</div><svg viewBox="0 0 105 65" aria-label="Right triangle"><path d="M20 8v42h67Z M20 42h8v8"/><text x="9" y="32">a</text><text x="53" y="60">b</text><text x="57" y="26">c</text></svg>c² = a² + b²</div>
<div class="formula"><div class="formula-name">30°–60°–90°</div><svg viewBox="0 0 105 65" aria-label="30°–60°–90°"><path d="M25 5v47h65Z"/><text x="11" y="30">x</text><text x="48" y="61">x√3</text><text x="61" y="24">2x</text><text x="28" y="20">60°</text><text x="66" y="48">30°</text></svg></div>
<div class="formula"><div class="formula-name">45°–45°–90°</div><svg viewBox="0 0 105 65" aria-label="45°–45°–90°"><path d="M25 7v45h49Z"/><text x="12" y="31">x</text><text x="48" y="61">x</text><text x="58" y="25">x√2</text><text x="29" y="24">45°</text></svg></div>
<div class="formula"><div class="formula-name">Rectangular box</div><svg viewBox="0 0 105 65" aria-label="Rectangular box"><path d="M17 24h53v29H17Z M17 24l18-16h53v29L70 53 M70 24L88 8 M88 37H35V8 M17 53l18-16"/><text x="39" y="63">l</text><text x="91" y="25">h</text><text x="78" y="52">w</text></svg>V = lwh</div>
<div class="formula"><div class="formula-name">Cylinder</div><svg viewBox="0 0 105 65" aria-label="Cylinder"><ellipse cx="52" cy="13" rx="25" ry="8"/><path d="M27 13v35c0 11 50 11 50 0V13 M52 13h25"/><text x="60" y="10">r</text><text x="82" y="35">h</text></svg>V = πr²h</div>
<div class="formula"><div class="formula-name">Sphere</div><svg viewBox="0 0 105 65" aria-label="Sphere"><circle cx="52" cy="30" r="25"/><ellipse cx="52" cy="30" rx="25" ry="8" stroke-dasharray="3 2"/><path d="M52 30h25"/><text x="62" y="26">r</text></svg>V = ⁴⁄₃πr³</div>
<div class="formula"><div class="formula-name">Cone</div><svg viewBox="0 0 105 65" aria-label="Cone"><ellipse cx="52" cy="50" rx="28" ry="7"/><path d="M24 50L52 5l28 45 M52 5v45h28"/><text x="55" y="30">h</text><text x="64" y="47">r</text></svg>V = ⅓πr²h</div>
<div class="formula"><div class="formula-name">Pyramid</div><svg viewBox="0 0 105 65" aria-label="Pyramid"><path d="M20 43L53 5l33 40-30 13Z M53 5l3 53 M20 43l29-9 37 11 M53 5v29"/><text x="57" y="29">h</text><text x="31" y="58">l</text><text x="74" y="59">w</text></svg>V = ⅓lwh</div>
</div>
<div class="formula-notes">The number of degrees of arc in a circle is 360.<br>The number of radians of arc in a circle is 2π.<br>The sum of the measures in degrees of the angles of a triangle is 180.</div>`;

/* ---------- calculator: safe expression parser (no eval) ---------- */
class CalcError extends Error {}

function tokenize(src) {
  const t = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      const s = src.slice(i, j);
      if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) throw new CalcError();
      t.push({ k: "num", v: Number(s) }); i = j; continue;
    }
    if (/[a-z]/i.test(c)) {
      let j = i;
      while (j < src.length && /[a-z]/i.test(src[j])) j++;
      const w = src.slice(i, j).toLowerCase();
      if (w === "pi") t.push({ k: "num", v: Math.PI });
      else if (w === "sin" || w === "cos" || w === "tan" || w === "sqrt") t.push({ k: "fn", v: w });
      else throw new CalcError();
      i = j; continue;
    }
    if (c === "π") { t.push({ k: "num", v: Math.PI }); i++; continue; }
    if (c === "√") { t.push({ k: "fn", v: "sqrt" }); i++; continue; }
    if (c === "+") { t.push({ k: "op", v: "+" }); i++; continue; }
    if (c === "-" || c === "−") { t.push({ k: "op", v: "-" }); i++; continue; }
    if (c === "*" || c === "×") { t.push({ k: "op", v: "*" }); i++; continue; }
    if (c === "/" || c === "÷") { t.push({ k: "op", v: "/" }); i++; continue; }
    if (c === "^") { t.push({ k: "op", v: "^" }); i++; continue; }
    if (c === "(" || c === ")") { t.push({ k: c }); i++; continue; }
    throw new CalcError();
  }
  return t;
}

// expr = term {(+|-) term}; term = unary {(*|/|implicit) unary}; unary = [+|-] unary | power;
// power = atom ["^" unary]; atom = number | "(" expr ")" | fn atom
export function evaluate(src, deg = true) {
  const t = tokenize(src);
  let p = 0;
  const peek = () => t[p];
  const take = () => t[p++];
  const isOp = v => peek() && peek().k === "op" && peek().v === v;

  function expr() {
    let x = term();
    while (isOp("+") || isOp("-")) { const o = take().v; const y = term(); x = o === "+" ? x + y : x - y; }
    return x;
  }
  function startsAtom() { const k = peek() && peek().k; return k === "num" || k === "fn" || k === "("; }
  function term() {
    let x = unary();
    for (;;) {
      if (isOp("*")) { take(); x *= unary(); }
      else if (isOp("/")) { take(); const y = unary(); if (y === 0) throw new CalcError(); x /= y; }
      else if (startsAtom()) x *= unary(); // 2π, 3(4+1), 2sin(30)
      else return x;
    }
  }
  function unary() {
    if (isOp("-")) { take(); return -unary(); }
    if (isOp("+")) { take(); return unary(); }
    return power();
  }
  function power() {
    const b = atom();
    if (isOp("^")) { take(); const e = unary(); const r = Math.pow(b, e); if (!Number.isFinite(r)) throw new CalcError(); return r; }
    return b;
  }
  function atom() {
    const tk = take();
    if (!tk) throw new CalcError();
    if (tk.k === "num") return tk.v;
    if (tk.k === "(") { const x = expr(); if (!peek() || peek().k !== ")") throw new CalcError(); take(); return x; }
    if (tk.k === "fn") {
      const a = atom();
      if (tk.v === "sqrt") { if (a < 0) throw new CalcError(); return Math.sqrt(a); }
      const r = deg ? a * Math.PI / 180 : a;
      if (tk.v === "sin") return Math.sin(r);
      if (tk.v === "cos") return Math.cos(r);
      if (Math.abs(Math.cos(r)) < 1e-12) throw new CalcError();
      return Math.tan(r);
    }
    throw new CalcError();
  }
  const x = expr();
  if (p < t.length) throw new CalcError();
  if (!Number.isFinite(x)) throw new CalcError();
  return x;
}

export function formatNumber(x) {
  let v = Number(x.toPrecision(12));
  if (Object.is(v, -0)) v = 0;
  return String(v);
}

// Returns text to show: a number, or "Error".
export function calculate(src, deg = true) {
  try { return formatNumber(evaluate(src, deg)); } catch { return "Error"; }
}

const KEYS = [
  ["sin", "sin(", "fn"], ["cos", "cos(", "fn"], ["tan", "tan(", "fn"], ["DEG", "DEG", "fn"],
  ["(", "(", "fn"], [")", ")", "fn"], ["xʸ", "^", "fn"], ["√", "√(", "fn"],
  ["C", "C", "fn"], ["⌫", "BS", "fn"], ["π", "π", "fn"], ["÷", "÷", "fn"],
  ["7", "7"], ["8", "8"], ["9", "9"], ["×", "×"],
  ["4", "4"], ["5", "5"], ["6", "6"], ["−", "−"],
  ["1", "1"], ["2", "2"], ["3", "3"], ["+", "+"],
  ["0", "0"], [".", "."], ["=", "=", "equals"], ["RAD", "RAD", "fn"],
];

// Fills `box` with the calculator body. Returns { focus() }.
export function mountCalculator(box) {
  box.innerHTML = `<div class="display"><div class="expression" data-expr>&nbsp;</div><div class="result" data-res>0</div></div>
    <div class="calcmode"><span>Scientific</span><span class="mode"><b data-m="DEG">DEG</b> | <b data-m="RAD">RAD</b></span></div>
    <div class="keys">${KEYS.map(([label, key, cls]) => `<button type="button" class="key ${cls || ""}" data-key="${key}">${label}</button>`).join("")}</div>`;
  const exprEl = box.querySelector("[data-expr]"), resEl = box.querySelector("[data-res]");
  let expr = "", result = null, deg = true;

  function draw() {
    exprEl.textContent = result === null ? " " : expr;
    resEl.textContent = result === null ? (expr || "0") : result;
    resEl.classList.toggle("error", result === "Error");
    box.querySelectorAll("[data-m]").forEach(b => b.classList.toggle("on", (b.dataset.m === "DEG") === deg));
    box.querySelectorAll('[data-key="DEG"],[data-key="RAD"]').forEach(b => b.classList.toggle("active", (b.dataset.key === "DEG") === deg));
    resEl.scrollLeft = resEl.scrollWidth;
  }
  function press(key) {
    const opKeys = ["+", "−", "×", "÷", "^"];
    if (key === "C") { expr = ""; result = null; }
    else if (key === "BS") { if (result !== null) { result = null; } else expr = expr.replace(/(sin\(|cos\(|tan\(|√\(|.)$/s, ""); }
    else if (key === "DEG" || key === "RAD") { deg = key === "DEG"; }
    else if (key === "=") {
      if (!expr) return;
      const r = calculate(expr, deg);
      result = r;
    } else {
      if (result !== null) {
        // a number or function starts a new calculation; an operator continues with the last result
        if (opKeys.includes(key) && result !== "Error") expr = result.replace("-", "−");
        else expr = "";
        result = null;
      }
      expr += key;
    }
    draw();
  }
  box.addEventListener("click", e => { const b = e.target.closest("[data-key]"); if (b) press(b.dataset.key); });
  (box.closest(".panel") || box).addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    let key = null;
    if (/^[0-9.()]$/.test(k)) key = k;
    else if (k === "+") key = "+";
    else if (k === "-") key = "−";
    else if (k === "*" || k === "x") key = "×";
    else if (k === "/") key = "÷";
    else if (k === "^") key = "^";
    else if (k === "p") key = "π";
    else if (k === "Enter" || k === "=") key = "=";
    else if (k === "Backspace") key = "BS";
    else if (k === "Delete" || k === "c" || k === "C") key = "C";
    if (key === null) return;
    e.preventDefault();
    press(key);
  });
  draw();
  return { press };
}
