Summary
Set the attachment token display to a static "not implemented" message so the UI no longer shows a numeric value that we don't support yet.

Changes
- initialized the attachments row in the overlay with "not implemented"
- forced `state.ui.attachmentTokens` to render the same message whether ready or not-ready

Tests
Not run (not requested)

Next
- Verify if/when we implement attachment token estimates, so this placeholder can be removed or replaced with real data.
