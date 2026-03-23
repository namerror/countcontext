# Devlogs

This folder contains per-session agent devlogs. Each session must create a new log and update the index.

## Required Log File

- Location: `docs/devlogs/`
- Filename format: `YYYY-MM-DD-<agent>-<title>.md`
- Date uses local timezone (America/New_York) unless otherwise specified.
- Title is lowercase kebab-case, letters/numbers/hyphens only, short (<= 6 words).

After creating the log file, add an entry to `docs/devlogs/Index.md`.

## Log Template

Use the exact section headings below in every devlog:

## Summary

## Changes

## Tests

## Next

## Index Format

`docs/devlogs/Index.md` should list logs chronologically, newest first, using this format:

- `YYYY-MM-DD` `agent` `title` - `docs/devlogs/YYYY-MM-DD-<agent>-<title>.md`
