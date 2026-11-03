// Waitlist form. Submitting opens the visitor's mail app with a ready letter to hello@bagira.study.
// Nothing is stored. The address and the letter stay visible under the button, with a Copy button.
export const WAITLIST_ADDRESS = "hello@bagira.study";
const SUBJECT = "Smart As: November 30 practice SAT waitlist";


export function buildLetter({ name, role, grade, extra }) {
  const lines = [
    "Hello,",
    "",
    "Please add me to the waitlist for the full-length practice SAT on Monday, November 30.",
    "",
    `Name: ${name || "(your first name)"}`,
    `I am a: ${role}`,
    `Student's grade: ${grade || "not given"}`,
  ];
  if (extra) lines.push("", extra);
  lines.push("", "Thank you.");
  return lines.join("\n");
}

export function mailtoHref(letter) {
  return `mailto:${WAITLIST_ADDRESS}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(letter)}`;
}

// el: container. getExtra: optional function returning extra letter text (the diagnostic result).
export function mountWaitlist(el, getExtra) {
  el.innerHTML = `<form class="wl-form" novalidate>
    <div class="field-row">
      <label class="f">First name<input name="name" autocomplete="given-name" required></label>
      <label class="f">I am a<select name="role"><option value="student">Student</option><option value="parent">Parent</option></select></label>
    </div>
    <label class="f">Student's grade<select name="grade"><option value="">Choose</option><option>9</option><option>10</option><option>11</option><option>12</option><option value="other">Other</option></select></label>
    <p class="form-error" role="alert"></p>
    <button class="btn btn-primary" type="submit">Join the waitlist</button>
  </form>
  <div class="wl-mail">
    <p>The button opens an email to <b>${WAITLIST_ADDRESS}</b>. No mail app? Copy the letter and send it from your own email.</p>
    <pre class="wl-letter" data-letter></pre>
    <button class="btn btn-ghost btn-small wl-copy" type="button" data-copy>Copy</button>
  </div>`;
  const f = el.querySelector("form");
  const pre = el.querySelector("[data-letter]");
  const err = el.querySelector(".form-error");
  const copyBtn = el.querySelector("[data-copy]");
  const letter = () => buildLetter({
    name: f.name.value.trim(), role: f.role.value, grade: f.grade.value,
    extra: getExtra ? getExtra() : "",
  });
  const refresh = () => { pre.textContent = `To: ${WAITLIST_ADDRESS}\nSubject: ${SUBJECT}\n\n${letter()}`; };
  f.addEventListener("input", refresh);
  refresh();
  f.addEventListener("submit", e => {
    e.preventDefault();
    if (!f.name.value.trim()) { err.textContent = "Enter your first name."; f.name.focus(); return; }
    err.textContent = "";
    window.location.href = mailtoHref(letter());
  });
  copyBtn.addEventListener("click", async () => {
    const text = pre.textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const r = document.createRange(); r.selectNodeContents(pre);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      try { document.execCommand("copy"); } catch {}
    }
    copyBtn.textContent = "Copied";
    setTimeout(() => { copyBtn.textContent = "Copy"; }, 1500);
  });
}
