# Summary

Updated the public-facing docs and release metadata for `0.9.0` so the project now describes its shipped behavior truthfully, including the current limitations around attachments, manual model selection, and incomplete history. Captured the earlier shipping review findings in this log so the remaining public-launch gaps stay visible.

# Changes

- rewrote `README.md` as the public overview with install, usage, limitations, privacy summary, support link, and release references
- refreshed `learn.html` so the in-extension explainer matches current behavior and clearly states what is not implemented yet
- added `PRIVACY.md` with a repo-level privacy policy covering local processing, local settings storage, and no outbound analytics or telemetry
- added `CHANGELOG.md` and started public-facing version history at `0.9.0`
- updated `manifest.json` to `0.9.0`, tightened the description, and removed the unnecessary `tabs` permission
- recorded remaining launch follow-ups from the product-shipping review: store assets still needed later, no automated QA flow yet, auto model detection is still missing, attachments remain unimplemented, and public launch should still include a browser test matrix

# Tests

- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"`
- `node --check background.js`
- reviewed `README.md`, `learn.html`, `PRIVACY.md`, `CHANGELOG.md`, and `manifest.json` for consistency

# Next

- Smoke-test the unpacked extension in Chrome/Brave/Edge and confirm the learn page still opens after removing the `tabs` permission.
- Add store assets, a release checklist, and a lightweight QA matrix before public launch.
- Revisit auto model detection and attachment support before calling the extension fully launch-ready.
