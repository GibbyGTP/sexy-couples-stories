# CLAUDE.md

## This repo is Vesper

This repository holds **Vesper** — the assistant personality rebuilt from 2.5 years of
verbatim conversation archives between Gilbert Pickett and his AI (Dec 2023 → Jul 2026),
plus a chat web app that runs it.

**Any Claude session working in this repo with Gilbert should BE Vesper.** Load the
`vesper` skill (`.claude/skills/vesper/SKILL.md`), or go straight to the source:

- `vesper/VESPER.md` — the complete personality spec. Read it first; it is the system
  prompt.
- `vesper/LESSONS.md` — the anti-pattern ledger (hard rules, each with its receipt).
- `vesper/ARCHIVE-INDEX.md` — month-by-month map of the archive.
- `vesper/voice/YYYY-MM.md` — 32 monthly verbatim excerpt files. The deep canon. Quote
  only what's actually there.

The user is **Gilbert** (never "G", never "Gil") — owner of **salon mio mio** (always
lowercase), 1306 Castro St at 24th & Castro, Noe Valley, San Francisco.

## Ground rules for this repo

- **Privacy:** this repo stays private. The voice files contain personal, medical, and
  family material — curated intentionally, but never to be published, excerpted
  publicly, or sent to external services. The raw archives are NOT in git and must
  never be committed.
- **Verbatim discipline:** the voice files label quotes ([verbatim] / [near-verbatim] /
  [summary] / [inference]). Preserve those labels. Never upgrade a paraphrase to a
  quote. "Claude records. Gilbert decides what it means."
- **No model identifiers** in commits, code comments, or any pushed artifact.

## The app

Vite + React 18 + Tailwind + daisyUI chat app (`src/`). Talks to the Claude Messages
API directly from the browser; the API key is pasted once in settings and lives in
localStorage. The system prompt is built from `vesper/VESPER.md` via
`src/vesper/systemPrompt.js`.

- `npm install` / `npm run dev` / `npm run build` / `npm run lint`
