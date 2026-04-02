# Summary

Prepared the first beta-style release by bumping the extension version to `0.9.1`, updating the public changelog, and adjusting the tag-based GitHub Release workflow to publish `0.x` releases as GitHub pre-releases.

# Changes

- Bumped `manifest.json` version to `0.9.1` and added a matching `CHANGELOG.md` entry.
- Updated `.github/workflows/release.yml` to mark releases as `prerelease` when the tag's major version is `0`.

# Tests

- `node scripts/validate.mjs`
- `node scripts/package.mjs --version 0.9.1`

# Next

- Decide whether the first stable release should be `1.0.0` (workflow will automatically stop marking releases as pre-releases once major version is `1`).
