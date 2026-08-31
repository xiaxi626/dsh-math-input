# Contributing to dsh-math-input

Thank you for considering a contribution to dsh-math-input, the zero-token
offline math input plugin for DeepSeek Harness.

## Development setup

Requirements: Node.js >= 20.

```bash
npm install
```

## Common commands

```bash
npm run typecheck   # TypeScript type checking (no emit)
npm run build       # Bundle with tsdown, then emit declarations with tsc
npm run lint        # ESLint over the repository
npm run lint:fix    # ESLint with automatic fixes
npm test            # Run tests with the Node.js test runner via tsx
```

The build output in `lib/` is committed to the repository (it is the artifact
loaded by DeepSeek Harness), so please run `npm run build` and include the
updated `lib/` files in your pull request.

## Pull request expectations

- Keep changes focused; one concern per pull request.
- Ensure `npm run typecheck`, `npm run build`, and `npm run lint` all pass
  before submitting.
- Add or update tests under `test/` for behavior changes where practical.
- Update `CHANGELOG.md` under the unreleased entry when user-visible behavior
  changes.
- User-facing strings must be localized through the locale files rather than
  hardcoded.
