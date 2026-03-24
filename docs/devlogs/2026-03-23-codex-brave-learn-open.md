# Summary
Adjusted the learn page link to open via the extension service worker to avoid Brave popup blocking.

# Changes
- added `background.js` service worker to open the learn page in a new tab
- updated the overlay link handler to message the service worker
- added `tabs` permission and background worker in the manifest

# Tests
Not run (not requested).

# Next
- Verify Brave opens the learn page without popup prompts after reloading the extension.
