# Summary

Fixed the per-message usage feature so badge visibility no longer changes token totals, checkbox state is visually reliable, and badges render below each message without covering text.

# Changes

- Updated message parsing in `content/core/page-context.js` to ignore CCX badge nodes when extracting conversation text.
- Added badge-aware text extraction in `content.js` for renderable message-node matching so existing badges do not alter alignment logic.
- Changed per-message badge rendering in `content.js` from unconditional clear/rebuild to update-in-place with stale-node cleanup.
- Marked injected badges with `data-ccx-message-usage="true"` for explicit filtering.
- Updated `styles.css` so text-input styles no longer apply to checkboxes.
- Added explicit checkbox styling under `#ccx-root` (`appearance`, fixed size, zero padding, `accent-color`) and dedicated `:focus-visible` outline.
- Reworked badge CSS to a below-right inline layout (`display: block`, `margin-left: auto`) and removed absolute top-right positioning.
- Added role-based badge styling so user labels render with a darker treatment and assistant labels render with a lighter treatment.
- Increased badge font size and padding slightly to improve readability.
- Added per-message role propagation from estimation output and used it to assign `user`/`assistant` badge classes in rendering.

# Tests

- `node --check content.js`
- `node --check content/core/page-context.js`
- `node --check content/ui/overlay-view.js`
- `node --check content/core/estimate-engine.js`

# Next

- Manually verify on live `chatgpt.com` threads that badge placement is consistently bottom-right for both user and assistant turns across layout variations.
