# Contributing

Thanks for helping improve BucketDesk.

## Local Setup

```bash
pnpm install
pnpm dev
```

Before opening a pull request, run:

```bash
pnpm typecheck
pnpm lint
```

For packaging-related changes, also run:

```bash
pnpm build
```

## Pull Request Guidelines

- Keep changes focused on one problem or feature.
- Include screenshots or screen recordings for UI changes.
- Avoid committing generated build outputs such as `out/`, `release/`, or `*.tsbuildinfo`.
- Do not commit real object storage credentials or private endpoints.
- Update README or docs when behavior, setup, or supported providers change.

## Code Style

This project uses TypeScript, React, ESLint, and Prettier. Prefer existing project patterns over introducing new abstractions.
