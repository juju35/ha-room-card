# Repository guide for agents

## Commits
- Write every commit message in **English**, following **Conventional Commits**:
  `type(scope): subject` — types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`,
  `perf`, `test`, `build`, `ci`, `revert`. Subject in imperative mood, lower case,
  no trailing period, ≤ 72 chars.
- Author identity must be **juju35** (`juju35 <julienstephan29@gmail.com>`), never an assistant identity.
- Messages are checked by **commitlint** (Conventional Commits) via the pre-commit
  `commit-msg` hook; run `pre-commit install` once so the hook is active locally.
- Keep history clean and linear: small, focused commits, one logical change each.
- `main` is protected: land changes through a PR (squash-merge, title + description).

## Before opening a PR — run the checks locally
CI mirrors these; running them first avoids round-trips:
```sh
pre-commit run -a
npx --yes jscpd@5.4.2 .
npm run check
node --test test/*.test.mjs
```

## Releasing — how it works here
A release is **automatic**: on push to `main`, if `package.json` carries a version with
no matching tag, the Release workflow publishes `vX.Y.Z`. **Never create a tag by hand.**
`dist/` is **not** committed — the bundle is built in CI and attached to the release.

The `Version consistency` check (validate.yml) requires the **same version in every place**,
or the release fails.

## Bumping the version
This is a **CARD** repo. A bump is complete only when **every** file below
carries the new version, updated together in one commit:
1. `CHANGELOG.md` → add a "## X.Y.Z - YYYY-MM-DD" section at the top (`### Features` | `Fixes` | `Performance` | `Maintenance`).
2. `package.json` → `"version": "X.Y.Z"`.
3. `package-lock.json` → run `npm install` so its version matches (CI checks it).
- Bump rule: `fix` → patch, `feat` → minor, breaking change → major.
- The PR/commit title carries the version in parentheses, e.g. `feat: new option (X.Y.Z)`.

## README layout
- Header order: H1, then the badge row, then the repo's **own logo** centered under the badges —
  `<p align="center"><img src=".../images/icon.svg" width="120"></p>`.
- **Brand logos**: right after the own logo, a centered `<p align="center">` row of the
  supported brands’ logos
  (`images/*.png|svg`), each linking to the brand site where relevant.
- Keep image `width`/`height` bounded so it doesn't render oversized (HACS/Marketplace).

## Supported integrations
This builds on other Home Assistant integrations, so keep the `## Supported integrations` section (title verbatim) listing the HA integrations it works on top of, with a link to each.

## Translations
- English is the source. Keep every language in sync when a user-facing string changes.
- Card UI strings are split per language by `scripts/i18n-split.mjs`; the non-English outputs are generated — **do not hand-edit them**; a CI check fails if the split is stale.

## Screenshots — do not edit or commit them by hand
The Screenshots workflow regenerates them on the PR branch and commits them with `[skip ci]`.
Comparison is exact. They are English, with light/dark twins, neutral/mock data, and never
real family names.

## Conventions
- Prefer YAML over UI configuration; keep configurations minimal; test iteratively.
- English-only README and screenshots; mock/neutral data in any published screenshot.
- Call it the **Marketplace** (Home Assistant 2026.11), not HACS, in docs, issue comments
  and user replies.
- Reply to GitHub issues in the **language of the issue / reporter**, not French by default.
