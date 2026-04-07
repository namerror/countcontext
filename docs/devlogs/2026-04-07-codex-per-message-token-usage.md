# Summary

Added an optional per-message usage display that shows token estimates and context-window percentage beside each chat message. The overlay now includes a persisted toggle to enable or disable these badges.

# Changes

- Added `showPerMessageUsage` to default settings in `config.js` and `content.js`.
- Added a `Per-message usage` checkbox to the overlay controls in `content/ui/overlay-view.js`.
- Extended estimation output in `content/core/estimate-engine.js` to compute per-message token and context-percent values when the toggle is enabled.
- Rendered per-message badges in `content.js` and made badge updates idempotent to avoid observer-triggered render loops.
- Added badge styling and checkbox width fix in `styles.css`.
- Updated `README.md` to mention the new optional per-message usage display.
- Added lightweight per-call memoization for per-message token estimation in `content/core/estimate-engine.js` to reduce duplicate estimator work when messages repeat.
- Renamed a loop index in `content.js` for clarity (`messageIndex`).
- Follow-up PR feedback: changed badge label format to `x tokens, x%` in `content.js`.
- Follow-up PR feedback: enabled `showPerMessageUsage` by default in `config.js` and `content.js`.

# Tests

- `node --check background.js`
- `node --check config.js`
- `node --check content.js`
- `node --check estimators/fast.js`
- `node --check estimators/method-b.js`
- `node --check estimators/precise.js`
- `node --check estimators/registry.js`
- `node --check tokenizers/ccx-tokenizer.js`
- `node --check vendor/gpt-tokenizer/o200k_base.js`
- `node --check vendor/gpt-tokenizer/cl100k_base.js`
- `node --check content/core/estimate-engine.js`
- `node --check content/ui/overlay-view.js`
- `node scripts/validate.mjs`
- `node --check content/core/estimate-engine.js`
- Manual browser verification with Playwright using a local fixture page and loaded extension scripts.
- `node --check config.js`
- `node --check content.js`
- `node scripts/validate.mjs`

# Next

- Verify the badge placement against live `chatgpt.com` DOM variations to ensure consistent position across both user and assistant turn layouts.
