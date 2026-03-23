# Agent Collaboration Guide

This repo uses structured devlogs to keep agent sessions transparent and easy to review.

## Required Devlog Per Session

Every agent session must create a devlog entry.

- Location: `docs/devlogs/`
- Filename format: `YYYY-MM-DD-<agent>-<title>.md`
- Date uses local timezone (America/New_York) unless otherwise specified.
- Title is lowercase kebab-case, letters/numbers/hyphens only, short (<= 6 words).

After creating the devlog file, update `docs/devlogs/Index.md` with a new entry.

## Devlog Template

Use the exact section headings below in each devlog:

- `Summary`
- `Changes`
- `Tests`
- `Next`

## What To Log

- Summary: one or two sentences of what changed.
- Changes: concise bullets of edits or decisions.
- Tests: list tests run, or state `Not run (not requested)`.
- Next: follow-up items or open questions.

## Coordination Norms

- Keep logs short and factual; avoid speculation.
- Call out risks or assumptions in `Summary` or `Next` if they affect future work.
- If multiple agents touch the repo the same day, each creates their own devlog.
