# CLAUDE.md

Project context for Claude Code and other agents. Keep this file focused on things that are **not** obvious from reading the repo — anything you can grep for in five seconds doesn't belong here.

Markdown in this repo is not manually wrapped. Write one paragraph per line and let the editor soft-wrap.

## Layout

- [packages/detype/](packages/detype/) — the published library and CLI (`detype` on npm). Built with tsdown. The package name is bare (unscoped) — an intentional exception that predates any "always scope under `@<org>/`" convention you may have seen in similar repos. Don't rename.
- [packages/detype/detype.js](packages/detype/detype.js) is a one-line stub that re-exports `./dist/cli.js`. It exists so the `bin` entry in `package.json` can point to a stable filename independent of the build output. Don't move it into `src/`.
- [packages/detype/test-files/](packages/detype/test-files/) — fixture inputs/expected outputs used by both the in-package unit tests and the e2e suite in [ci/](ci/). Edit pairs (`input.*` + `expected.*`) together.
- [ci/](ci/) — internal, non-published workspace package that holds the e2e suite. Run via `pnpm run ci` from the root; it shells out to the built CLI binary and compares output against the fixtures.

The root [readme.md](readme.md) is a symlink into the package's readme. Edit the symlink target, not the symlink.

## Stack invariants

These are deliberate. Don't change them without a reason.

- **ESM only.** No CJS output, no `"type": "commonjs"`. tsdown is configured for `format: ["esm"]` and `platform: "node"`. v2 shipped dual ESM+CJS; v3 dropped CJS — that's a breaking change captured in the version, don't quietly reintroduce CJS.
- **Strict TS** with `noUncheckedIndexedAccess` and `noImplicitOverride`. The package's [tsconfig.json](packages/detype/tsconfig.json) uses `module: "preserve"` with `customConditions: ["import"]` rather than `nodenext` — this is intentional and predates the nodenext convention; don't "fix" it without a reason.
- **Relative imports use `.ts` extensions**, not `.js`. Lint enforces this; tsconfigs allow it via `allowImportingTsExtensions`. The point is that source runs natively under Node's TS support and Deno, no transpile step required.
- **Tabs, 80 cols.** Markdown and `package.json` use 2-space indent (see [.prettierrc](.prettierrc)). Don't reformat with spaces.
- **Node**: the published source in [packages/detype/src/](packages/detype/src/) targets the lowest `engines.node` major. The support range covers every active LTS and every Current release — there is often more than one of each (right now: 22 and 24 are LTS; 25 and 26 are Current). Dev tooling, build configs, and scripts (e.g. `tsdown.config.ts`) can assume the latest minor of the most recent LTS — features that landed in recent LTS minors are fair game there; Current-only features aren't. Off-limits inside the package `src/`.
- **ESLint config** comes from `@cyco130/eslint-config/node`. Lint rules live there, not in-repo.

## Library invariants

detype-specific design choices that look like bugs or dead code if you don't know why they're there.

- **Output preserves formatting, not just types.** detype is not just `tsc --emit` or `babel`. It runs the source through Babel to strip TS annotations, then through Prettier to re-format. The whole reason the project exists is that naive type-stripping mangles whitespace and the result is unusable as a published JS counterpart to a TS source. Don't replace the Prettier pass with a "faster" string-rewrite — the formatting fidelity _is_ the product.
- **Magic comments** (`@detype: replace` / `@detype: with` / `@detype: end`) let authors substitute a JS-only block for a TS-only block during transform. `transform` applies them; `removeMagicComments` strips them without performing the TS→JS transform. Both modes exist because some consumers want the comments cleaned out of their TS source after a refactor.
- **Vue SFC support** uses `@vue/compiler-sfc` and the pinned `@vuedx/*` packages. The `@vuedx/*` deps are intentionally pinned (not Renovate-updated — see `ignoreDeps` in [.github/renovate.json](.github/renovate.json)); they're an abandoned upstream and bumping them has historically broken Vue parsing. Audit any change to Vue handling against the `input.vue` / `expected.vue` fixtures.
- **`--remove-ts-comments`** strips `@ts-ignore` and `@ts-expect-error` because those have no meaning in the emitted JS. Off by default — turning it on is a destructive op the user has to ask for.
- **CLI inference rules.** With one argument, `detype input.ts` infers `input.js`, `input.tsx` → `input.jsx`, `.vue` → `.vue` (overwrite refused unless `-m` is also passed). With a directory, the output dir is required. These shortcuts are documented in `--help`; don't tighten them without updating the help text.

## Commands

Run from the repo root unless noted.

- `pnpm dev` — watch-build the package.
- `pnpm build` — build the package.
- `pnpm test` — runs every script matching `test:*` (uses pnpm's `/^test:/` pattern syntax). Adding a new `test:foo` script auto-joins the suite — no test runner registry to update.
- `pnpm run ci` — runs the e2e suite in [ci/](ci/) against the **built** CLI. Two gotchas: (a) the script does not auto-build, so a stale or missing `packages/detype/dist/` will silently invalidate the run — `pnpm build` first; (b) must be spelled `pnpm run ci`, not `pnpm ci` — pnpm treats bare `pnpm ci` as a built-in alias for `pnpm install --frozen-lockfile`, which shadows this script.
- `pnpm format` — Prettier write across the repo.

Inside [packages/detype/](packages/detype/), `pnpm test` fans out to `test:typecheck` (`tsc --noEmit`), `test:lint` (eslint), `test:unit` (vitest run), and `test:package` (publint).

## E2E suite (ci/)

[ci/ci.test.ts](ci/ci.test.ts) shells out to the built CLI (resolved via `pnpm exec detype` against `packages/detype/dist/cli.js`) on each `input.*` fixture in [packages/detype/test-files/](packages/detype/test-files/) and compares the result to the matching `expected.*`. The build is a prerequisite; e2e and the in-package unit tests share the same fixtures, which is why `test-files/` lives inside the package rather than at the repo root.

There are also unit tests in [packages/detype/src/](packages/detype/src/) (`*.test.ts`) that exercise the library API directly. Unit tests and the e2e suite are not redundant: unit tests pin the library's API contract (transform / transformFile / removeMagicComments) and mock fs/prettier where useful, while the e2e suite catches packaging regressions — wrong `bin` wiring, missing `files` entries, broken shebang, dist output that doesn't load — that the unit tests cannot.

## Versioning and publishing

- `./version <semver-arg>` (e.g. `./version patch`, `./version 1.2.0`) bumps the package's version. Run this from a clean tree — it edits `package.json` and the lockfile.
- Publishing is wired up in [.github/workflows/publish.yml](.github/workflows/publish.yml).

## Tooling around the edges

- **husky + lint-staged** run on pre-commit. If a commit is being blocked, fix the underlying lint/format issue rather than bypassing the hook.
- **Renovate** config lives at [.github/renovate.json](.github/renovate.json). `@vuedx/*` is in `ignoreDeps` on purpose — see Library invariants.
- **VSCode** recommended extensions and settings live in [.vscode/](.vscode/).
