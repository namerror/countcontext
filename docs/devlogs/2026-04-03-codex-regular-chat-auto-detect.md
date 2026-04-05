# Summary

Implemented regular-chat-only support detection with automatic recalculation on ChatGPT SPA navigation. Non-regular layouts now stay visible in the overlay but render as `Unsupported` instead of showing stale estimates.

# Changes

- Added a page-support state flow in `content.js` with `supported_regular_chat`, `unsupported_project_or_nonchat`, and `unsupported_unknown_layout` handling.
- Added centralized `refreshFromPageState()` to gate estimation and rendering based on detected support status.
- Added navigation-driven recalc triggers via wrapped `history.pushState`/`replaceState`, `popstate`, `hashchange`, and URL polling fallback.
- Kept `MutationObserver` recalc behavior and unified all triggers behind debounced `scheduleRecalc()`.
- Updated unsupported UI behavior to keep overlay visible while replacing metrics with `Unsupported` and showing explicit warning text.
- Updated `README.md` to document supported surfaces (`/` and `/c/<id>`), unsupported layouts (Projects/non-regular), and automatic refresh behavior.

# Tests

- `node scripts/validate.mjs`
- `node --check content.js`

# Next

- Validate against live ChatGPT UI variants to confirm route detection still matches current URL patterns and layout signals.
