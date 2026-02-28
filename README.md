# Omnibox Best URL

Install:

1. Open Chrome and go to `chrome://extensions`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select the extension folder: `f:/tech-projects/XpertFlow`.

Usage:

- In the address bar type `best` then press Space or Tab, then enter your query.
- Examples:
  - `best github.com` — opens https://github.com
  - `best openai` — performs an "I'm Feeling Lucky" Google redirect to the top match
  - `best how to cook rice` — goes to the top Google result

Change the omnibox keyword by editing `manifest.json` -> `omnibox.keyword`.

## Building from TypeScript

This project has been converted to TypeScript. Chrome service workers **do not** support ES modules, so browserify we previously relied on `tsc` alone and the output would contain `import`/`export` statements that break at runtime. To address this we now use a lightweight bundler (`esbuild`) which inlines all imports and produces a single non‑module script.

Install dependencies and build:

```bash
npm install        # install dev dependencies (typescript, esbuild, etc.)
npm run build      # typecheck & bundle into `dist/background.js`
```

For continuous development use:

```bash
npm run watch      # rebuild on source changes (esbuild watch mode)
```

The final file at `dist/background.js` no longer contains any `import` or `export` keywords and is safe to use as the service worker in `manifest.json`.

Once `dist/background.js` exists, load or reload the unpacked extension as before.

# XpertFlow
