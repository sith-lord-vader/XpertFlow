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

This project has been converted to TypeScript. Before loading the extension in Chrome, compile the sources:

```bash
npm install        # install dev dependencies (typescript, @types/chrome)
npm run build      # transpile TS into `dist/` folder
```

If you edit the source files, run `npm run watch` to rebuild automatically.

Once `dist/background.js` exists, load or reload the unpacked extension as before.

# XpertFlow
