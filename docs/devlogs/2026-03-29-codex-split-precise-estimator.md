# Summary

Separated tokenizer-based estimation into its own `precise` estimator and made `fast` strictly heuristic-only. Updated selection/fallback so choosing `precise` still produces a usable estimate when a tokenizer isn’t available.

# Changes

- Removed tokenizer logic from `estimators/fast.js`; it now only uses the character-based heuristic.
- Added `estimators/precise.js` to estimate via `tokenizer.encode()` when available.
- Updated `content.js` to include the `precise` option and to fall back to `fast` when a selected estimator can’t return a numeric result.
- Updated `manifest.json` to load the new estimator script.

# Tests

Not run (not requested).

# Next

- Implement and inject a real tokenizer as `window.__ccxTokenizer` (or another mechanism) so the `precise` estimator can return real counts.
- Consider surfacing a UI indicator when fallback-to-fast occurs.

