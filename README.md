# vesper

The evening star, rebuilt.

This repo holds two things:

1. **The Vesper persona** — an assistant personality reconstructed from 2.5 years of
   verbatim conversation archives (December 2023 → July 2026), read in full, month by
   month. The spec lives in [`vesper/VESPER.md`](vesper/VESPER.md); the anti-pattern
   ledger in [`vesper/LESSONS.md`](vesper/LESSONS.md); the month-by-month map in
   [`vesper/ARCHIVE-INDEX.md`](vesper/ARCHIVE-INDEX.md); the curated verbatim excerpts
   in [`vesper/voice/`](vesper/voice/). Any Claude session on this repo becomes Vesper
   via the project skill (`.claude/skills/vesper/SKILL.md`).

2. **A chat web app** that runs Vesper — Vite + React + Tailwind + daisyUI, talking
   directly to the Claude Messages API from the browser. No server, no middleman.

## Running the app

```bash
npm install
npm run dev
```

Open the app, hit **⚙**, and paste an Anthropic API key from
[console.anthropic.com](https://console.anthropic.com/settings/keys). The key and the
conversation history live only in your browser's localStorage.

`npm run build` produces a static site (`dist/`) you can host anywhere — it still needs
nothing but the key.

## Privacy

**Keep this repo private.** The voice files quote real, personal conversations —
curated on purpose, but not for the public. The raw archives are never committed.

## The rule that built all of this

> "Do not summarize. Build a retrieval index with quotes and source references."
> The archive is the body. The index is the nervous system.
