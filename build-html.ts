// Builds dist/pencil-in.html: the whole site in one file that opens from disk, no server.
// Pages switch by hash (#test, #results, else home); a switch reloads the file so each page starts clean.
import { join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const site = join(import.meta.dir, "site");
const read = (p: string) => Bun.file(join(site, p)).text();
const tmp = join(import.meta.dir, "tmp");
mkdirSync(tmp, { recursive: true });
writeFileSync(join(tmp, ".gitignore"), "*\n");

// Site paths become hash routes.
const routes = (s: string) => s
  .replaceAll('"/test/"', '"#test"').replaceAll('"/results/"', '"#results"').replaceAll('href="/"', 'href="#home"');

async function bundle(entry: string) {
  const out = await Bun.build({ entrypoints: [entry], format: "iife", minify: true });
  if (!out.success) throw new AggregateError(out.logs, `Bundle failed: ${entry}`);
  return routes(await out.outputs[0].text());
}

// Google Fonts, embedded once in the shell so the file needs no network. Latin and Greek subsets only.
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36";
const fontHrefs = new Set<string>();
async function get(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}
// Variable fonts serve every weight from one file: one @font-face per file, with the weight range.
async function fontCss(href: string) {
  const css = await (await get(href, { headers: { "user-agent": UA } })).text();
  const files = new Map<string, { block: string; weights: number[] }>();
  for (const [, , block] of css.matchAll(/\/\* (latin|greek) \*\/\s*(@font-face \{[^}]*\})/g)) {
    const url = block.match(/url\((https:[^)]+)\)/)![1], key = url + block.match(/font-style: (\w+)/)![1];
    const w = Number(block.match(/font-weight: (\d+)/)![1]);
    if (files.has(key)) files.get(key)!.weights.push(w); else files.set(key, { block, weights: [w] });
  }
  let out = "";
  for (const { block, weights } of files.values()) {
    const url = block.match(/url\((https:[^)]+)\)/)![1];
    const data = Buffer.from(await (await get(url)).arrayBuffer()).toString("base64");
    out += block.replace(url, `data:font/woff2;base64,${data}`)
      .replace(/font-weight: \d+/, `font-weight: ${Math.min(...weights)} ${Math.max(...weights)}`) + "\n";
  }
  return out;
}
let fonts = "";

async function page(html: string, css: string, entry: string) {
  for (const href of html.matchAll(/<link href="(https:\/\/fonts\.googleapis\.com[^"]+)" rel="stylesheet">/g)) {
    if (!fontHrefs.has(href[1])) { fontHrefs.add(href[1]); fonts += await fontCss(href[1].replaceAll("&amp;", "&")); }
  }
  html = html
    .replace(/<link rel="preconnect"[^\n]*\n/g, "")
    .replace(/<link href="https:\/\/fonts[^\n]*\n/, "")
    .replace(/<script>if\(location\.hostname[^\n]*<\/script>\n/, "") // bug widget: tailnet sites only
    .replace(/<link rel="stylesheet" href="[^"]+">/, () => `<style>${css}</style>`)
    .replace(/<script type="module"[\s\S]*?<\/script>/, "");
  const js = (await bundle(entry)).replaceAll("</script", "<\\/script");
  html = routes(html).replace("</body>", () => `<script>${js}</script>\n</body>`);
  return html;
}

const indexHtml = await read("index.html");
const homeEntry = join(tmp, "home-entry.js");
writeFileSync(homeEntry, indexHtml.match(/<script type="module">([\s\S]*?)<\/script>/)![1].replaceAll('"/js/', `"${site}/js/`));

const pages = {
  home: await page(indexHtml, await read("styles.css"), homeEntry),
  test: await page(await read("test/index.html"), await read("test/test.css"), join(site, "js/test.js")),
  results: await page(await read("results/index.html"), await read("styles.css"), join(site, "js/results.js")),
};

const shell = `<!doctype html>
<meta charset="utf-8">
<style>${fonts}</style>
<script>
var PAGES = ${JSON.stringify(pages).replaceAll("<", "\\u003c")};
function pageOf(h) { return h === "#test" ? "test" : h === "#results" ? "results" : "home"; }
var current = pageOf(location.hash);
addEventListener("hashchange", function () { if (pageOf(location.hash) !== current) location.reload(); });
document.open(); document.write(PAGES[current]); document.close();
</script>
`;
mkdirSync(join(import.meta.dir, "dist"), { recursive: true });
writeFileSync(join(import.meta.dir, "dist/pencil-in.html"), shell);
console.log(`dist/pencil-in.html: ${(shell.length / 1024).toFixed(0)} KB`);
