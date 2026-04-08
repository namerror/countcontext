# Changelog

All notable public-facing changes to this project will be documented in this file.

## [0.9.4] - 2026-04-07

### Added
- The extension now displays "unsupported" on unsupported pages (e.g., chats in ChatGPT projects) instead of showing a false estimate.
- Added auto-refresh when navigating between conversations.
- Added dragging support for the overlay. Now users can click and drag the overlay to reposition it on the screen.
- Added per-message token display in the overlay. Users can now see the token count and context usage for each individual message in the conversation history, providing more granular insight into token usage.

## [0.9.3] - 2026-04-02

### Changed
- Tightened host match patterns to only run on `https://chatgpt.com/*`.

## [0.9.2] - 2026-04-01

### Changed
- Updated extension icon packs.

## [0.9.1] - 2026-04-01 - Superceded by 0.9.2 due to a minor issue with the icon.

### Added

- Added an extension icon.

### Changed

- Refreshed the overlay UI styling to a light theme.
- Updated `learn.html` styling to match the new theme.

## [0.9.0] - 2026-03-29

### Added

- Added `PRIVACY.md` with the project's browser-local data handling policy.
- Added a public-facing `CHANGELOG.md` starting with version `0.9.0`.

### Changed

- Rewrote `README.md` to reflect the current shipped behavior and known limitations.
- Updated `learn.html` so the in-extension explainer matches the actual product state.
- Updated `manifest.json` to use version `0.9.0`, tightened the description, and removed the unnecessary `tabs` permission.

### Notes

- Attachments are not implemented and are not counted.
- Model detection is not automatic yet; users must choose plan and model manually.
- Estimates depend on the visible history loaded in the page and may be incomplete if older turns are not present.
