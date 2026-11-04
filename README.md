# SAT Landing

Static landing page: plain HTML and CSS in `site/`, no build step.

- `site/`: the pages. `/` serves `site/index.html`; a missing page gets `site/404.html` when it exists.
- `serve.ts`: the server, `PORT=<port> bun serve.ts`. `/health` answers the commit it runs.
- `scripts/export-html.ts`: the landing, the quick test and its result as one HTML file that opens from disk, `bun scripts/export-html.ts <out.html>`. Pages switch by hash: `#/test/`, `#/results/`.
- `docs/guide/`: tutorial, how-to, reference and explanation. `docs/product/`: scope, user stories, architecture.
- Staging site: the board runs `.staging-site.json`'s command from branch `staging`.
- Task test site: `paneweb up` runs `.paneweb.json`'s command.
- The `<script>` in `site/index.html` loads the board's bug report widget on tailnet sites. Keep it in every page.
