# ChatGPT Context Counter

`ChatGPT Context Counter` is a Chrome/Chromium extension that estimates how much of the current ChatGPT conversation context is in use. It adds a small overlay on `chatgpt.com` with a percentage, token estimate, and a basic breakdown.

This project is currently preparing for a public beta release. The extension is useful today, but it is still best described as an estimate rather than an exact measurement.

## What Works Today

- Estimates token usage from the conversation text loaded in the page.
- Shows total estimated tokens, chat text tokens, overhead tokens, and percent used.
- Supports two estimation methods:
  - `Fast`: character-based heuristic
  - `Precise`: bundled tokenizer-based estimate
- Lets you manually select your ChatGPT plan and model.
- Warns when the visible history may be incomplete.
- Stores your selected settings locally in the browser.

## Current Limitations

- Attachments are **not implemented yet** and are not included in totals.
- Automatic model detection is **not implemented yet**; model selection is manual.
- ChatGPT Projects / project-wide context are **not supported**.
- Estimates only use content currently present in the DOM, so unloaded or virtualized history can make totals low.
- Very large chats can cause `Precise` estimation to fall back to `Fast`.
- The extension is informational only and should not be treated as an exact tokenizer for ChatGPT web internals.

## Supported Browsers

- Chrome
- Chromium
- Edge
- Brave

Any Chromium-based browser that supports Manifest V3 extensions should work, but Chrome/Chromium-based desktop browsers are the intended target.

## Install

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this repository folder.
5. Open `https://chatgpt.com` and start or open a conversation.

## Usage

1. Open ChatGPT on `https://chatgpt.com`.
2. Find the collapsed counter in the bottom-right corner.
3. Click it to expand the panel.
4. Select your plan and model manually.
5. Choose `Fast` or `Precise` estimation.
6. Click `Recalculate` after scrolling up or loading more history.

## How To Read The Estimate

- `Chat text` is based on visible conversation text only.
- `Overhead` is a fixed reserve for system and formatting costs.
- `Attachments` currently show `Not implemented`.
- `Context size` uses built-in defaults for the selected plan/model unless you change the code defaults in the project.

For the in-extension explainer, see `learn.html`.

## Privacy Summary

- The extension reads conversation content from the open `chatgpt.com` page in order to estimate tokens.
- Processing happens locally in your browser.
- Settings are stored locally with `chrome.storage.local`.
- The extension does not send analytics, telemetry, or conversation contents to an external server.

See `PRIVACY.md` for the full privacy policy.

## Support

- Report bugs or request features via GitHub issues: `https://github.com/namerror/countcontext/issues`

## Release Notes

- `CHANGELOG.md` tracks public-facing release history starting with `0.9.0`.

## Dev Logs

Agent session logs live in `docs/devlogs/`. See `docs/devlogs/README.md` for the format and `docs/devlogs/Index.md` for the index.
