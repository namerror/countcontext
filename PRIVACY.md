# Privacy Policy

Last updated: 2026-03-29

## Overview

ChatGPT Context Counter is a browser extension that estimates ChatGPT conversation context usage on `chatgpt.com`. It processes page content locally in your browser so it can calculate approximate token usage.

## What Data The Extension Accesses

The extension reads content that is already present in the open ChatGPT page, including visible conversation text and page state needed to produce an estimate.

The extension also stores your local preferences, such as selected plan, model, and estimation method.

## How Data Is Used

The extension uses page content only to:

- estimate visible conversation token usage
- show context percentage and token breakdowns
- detect when history may be incomplete

The extension uses local settings storage only to remember your extension preferences between sessions.

## Local Processing

- Processing happens locally in your browser.
- Settings are stored using `chrome.storage.local`.
- The extension does not operate a backend service.

## Data Sharing

- No conversation data is sent to external servers by this extension.
- No analytics or telemetry are collected by this extension.
- No data is sold.
- No data is shared for advertising.

## Third-Party Services

This extension runs on `chatgpt.com`, which is operated separately from this project. Your use of ChatGPT is also governed by OpenAI's own terms and privacy practices.

## Data Retention And Deletion

The extension stores only local settings in your browser.

You can clear this data by:

1. Removing the extension from your browser, or
2. Clearing the extension's stored data through your browser's extension settings.

## Contact And Support

For privacy questions, bug reports, or support requests, please open an issue at:

`https://github.com/namerror/countcontext/issues`
