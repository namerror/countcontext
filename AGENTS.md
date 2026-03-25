# Agent Collaboration Guide

This repo uses structured devlogs to keep agent sessions transparent and easy to review.

## Required Devlog Per Session

Every agent session must create a devlog entry **unless it's a quick internal discussion, short fix, or minor update**.

You can skip devlogs for:
- Quick internal discussions (e.g., "Discussed approach with team, decided to proceed with X, generated a report").
- Short fixes (e.g., "Fixed typo in README, no impact on functionality").
- Minor updates (e.g., "Updated comments for clarity, no code changes").

You should also update the same devlog if you operated during *the same session* and made multiple edits. For example, if you made a code change and was instructed to make a follow-up edit within the same session, you can update the original devlog instead of creating a new one.

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
