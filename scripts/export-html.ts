// One HTML file with the whole site (landing, test, result page), to send around and open from disk without a server.
// Each page is stored as data: title, styles, body and its scripts bundled into one module.
//
//   open file ──► page from the hash: #/test/ → test, #/results/ → result, else landing (#faq etc. are landing anchors)
//             ──► insert the page's styles and body, run its module
//   go to another page (#/, #/test/, #/results/) ──► reload the file ──► page from the hash again
//
// Usage: bun scripts/export-html.ts <out.html>
import { dirname, join } from "node:path";

const out = process.argv[2];
if (!out) throw new Error("Usage: bun scripts/export-html.ts <out.html>");
const site = join(import.meta.dir, "..", "site");
const PAGES = { landing: "index.html", test: "test/index.html", results: "results/index.html" };

// Site paths become hashes; a stray one left behind would send the file to a missing page.
const STRAY = /(?<![#\w])\/(test|results)\//;
const routes = (s: string) => s
  .replaceAll('"/test/"', '"#/test/"').replaceAll('"/results/"', '"#/results/"').replaceAll('href="/"', 'href="#/"');

async function bundle(code: string, dir: string) {
  const r = await Bun.build({
    entrypoints: ["entry.js"], format: "esm", target: "browser",
    plugins: [{
      name: "entry", setup(b) {
        b.onResolve({ filter: /^entry\.js$/ }, () => ({ path: "entry.js", namespace: "entry" }));
        b.onLoad({ filter: /.*/, namespace: "entry" }, () => ({ contents: code, loader: "js", resolveDir: dir }));
        b.onResolve({ filter: /^\/js\// }, a => ({ path: join(site, a.path) }));
      },
    }],
  });
  if (!r.success) throw new AggregateError(r.logs, "Bundling failed.");
  // Same-page navigation (Retake on the test page) must reload too: a hash set to itself fires no hashchange.
  // Bun marks each module with its path relative to the cwd; drop those, they leak the build machine's folders.
  return routes((await r.outputs[0].text()).replace(/^\/\/ \S+\.js\n/gm, "")).replace(/location\.href\s*=\s*("#\/[^"]*"|TEST\d*\.\w+Url)/g, "__go($1)");
}

const fonts = new Set<string>();
const data: Record<string, { title: string; css: string; body: string; js: string }> = {};
for (const [name, file] of Object.entries(PAGES)) {
  const path = join(site, file);
  const html = await Bun.file(path).text();
  for (const m of html.matchAll(/<link href="(https:\/\/fonts\.googleapis\.com[^"]+)" rel="stylesheet">/g)) fonts.add(m[1]);
  const css = await Bun.file(join(site, html.match(/<link rel="stylesheet" href="([^"]+)">/)![1])).text();
  let body = html.slice(html.indexOf("<body>") + 6, html.lastIndexOf("</body>"));
  let js = "";
  for (const m of body.matchAll(/<script type="module"( src="([^"]+)")?>([\s\S]*?)<\/script>/g)) {
    js += await bundle(m[2] ? `import ${JSON.stringify(join(site, m[2]))};` : m[3], dirname(path));
  }
  body = routes(body.replace(/<script[\s\S]*?<\/script>/g, ""));
  for (const m of body.matchAll(/src="(\/img\/[^"]+\.webp)"/g)) {
    body = body.replace(m[1], "data:image/webp;base64," + Buffer.from(await Bun.file(join(site, m[1])).arrayBuffer()).toString("base64"));
  }
  if (STRAY.test(js) || STRAY.test(body)) throw new Error(`A site link was left unconverted in ${file}.`);
  data[name] = { title: html.match(/<title>(.*?)<\/title>/)![1], css, body, js };
}

const boot = `const PAGES = ${JSON.stringify(data).replace(/</g, "\\u003c")};
const pageOf = h => h.startsWith("#/test/") ? "test" : h.startsWith("#/results/") ? "results" : "landing";
const name = pageOf(location.hash), page = PAGES[name];
window.__go = h => location.hash === h ? location.reload() : location.hash = h;
addEventListener("hashchange", () => { if (pageOf(location.hash) !== name) location.reload(); });
document.title = page.title;
document.getElementById("page").textContent = page.css;
document.body.innerHTML = page.body;
document.body.append(Object.assign(document.createElement("script"), { type: "module", textContent: page.js }));`;

await Bun.write(out, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${data.landing.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${[...fonts].map(f => `<link href="${f}" rel="stylesheet">`).join("\n")}
<style id="page"></style>
</head>
<body>
<script>${boot.replace(/<\/script/gi, "<\\/script")}</script>
</body>
</html>
`);
console.log(`Wrote ${out}`);
