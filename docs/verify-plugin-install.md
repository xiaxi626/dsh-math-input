# Verifying the plugin-load contract (plugin add → dsh web cold boot → UI)

**English** | [中文](./verify-plugin-install.zh-CN.md)

This guide verifies the **plugin-load contract** — the full path that a real
user takes when installing this plugin from GitHub or npm:

- **A. Install registration** — after `dsh plugin --profile <name> add` installs
  this package, reconcile reads the `dsh.bundle.patch: cordis.patch.yml`
  declaration in `package.json` and appends the package to the profile's
  `dsh.profile.bundles` layer.

- **B. Cold-boot loading** — at `dsh web` startup, the `insert` entry in
  `cordis.patch.yml` is handed to the cordis loader as a **bare package name**;
  Node module resolution hits the package in the profile's `node_modules`, and
  `main` / `exports["."]` load `lib/index.js` (the Host entry).

- **C. Client discovery** — the browser half is discovered through the
  `dsh.client` manifest in `package.json`, not through the Host entry. A missing
  or malformed `dsh.client` means the Host loads fine but the "+" button never
  appears.

The contract has three parts, all required:

1. the `cordis.patch.yml` entry must be a **bare package name**
   (`dsh-math-input`) — a relative path is anchored at the profile root and
   points at the structurally nonexistent `<profile>/lib/index.js`;
2. `package.json` must have `main` and `exports["."]` pointing at
   `lib/index.js` (Host entry loading);
3. `package.json` must have a `dsh.client` manifest (browser-side discovery).

Break (1) or (2) and `dsh web` cold boot fails with `ERR_MODULE_NOT_FOUND` and a
whole-tree load failure. Break (3) and the server starts clean but the "+"
button is absent — the Host loaded but the Client was never discovered.

> **Why the overlay smoke test doesn't cover this**: `overlay.yml` injects the
> Host entry by **absolute path**, bypassing `node_modules` resolution entirely.
> It can't catch a broken `main`/`exports` contract or a missing `dsh.client`
> manifest. This guide is the only test that exercises the real install path.

## Relation to your real `~/.dsh` (read first)

- **This walkthrough writes to your real** **`~/.dsh/profiles/web/`** (install,
  boot, remove). A temp `DSH_HOME` cannot substitute: the very thing under test
  is the real profile's load path.

- **No GitHub access needed**: a local `file:` source stands in for the
  `github:` spec; everything after `file:` is identical to a real install —
  pnpm materializes into the profile's `node_modules` → reconcile registers the
  bundle → cold boot resolves it.

- The cleanup step restores the profile to its original state (base bundles
  only).

## Prerequisites

- Node.js ≥ 20 (per `engines` in `package.json`), `npx` available, npm registry
  reachable

- This repo checked out; if you changed `src/`, run `npm run build` first (the
  loaded entry is the compiled `lib/` output)

- A `web` profile exists on this machine (running `dsh web` once initializes it)

***

## Part 1 — quality gates (static contract checks)

```bash
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # ESLint 9 + typescript-eslint
npm test            # node:test + tsx — expected: all tests pass
npm run build       # tsdown + tsc → lib/
```

Three static contract checks (any miss is a regression):

```bash
grep -n "name:" cordis.patch.yml      # expected: name: dsh-math-input — bare package name, no './' prefix
grep -n '"main":' package.json        # expected: "main": "lib/index.js"
grep -n '"\.":' package.json          # expected: exports contains "." with "./lib/index.js"
grep -n '"client"' package.json       # expected: dsh.client manifest present
```

***

## Part 2 — end-to-end walkthrough (local source stands in for GitHub)

Before pushing to GitHub, the remote commit may not exist yet, so a `github:`
install would fail. Use the local workspace as the package source instead.
**Everything after** **`file:`** **is identical to a real** **`github:`** **install**: pnpm
materializes into the profile's `node_modules` → reconcile registers the bundle
→ cold boot resolves it → the Client is discovered via `dsh.client`.

One copy-paste block per platform. Replace `PROJECT` with your checkout path.

### Windows (Git Bash / MINGW64)

```bash
PROJECT="$(cygpath -m ~/Downloads/dsh-math-input)"   # ← your path (forward slashes)
cd "$PROJECT"

echo "--- [a] install the local package ---"
npx @deepseek-ai/dsh plugin --profile web add "file:$PROJECT"; echo "exit=$?"

echo "--- [b] confirm registration in the bundles layer ---"
cat ~/.dsh/profiles/web/package.json
# expected: dsh.profile.bundles contains "dsh-math-input"; dependencies has the file: entry

echo "--- [c] cold boot (the original crash point) ---"
npx @deepseek-ai/dsh web --no-open
# expected: prints "dsh web: http://127.0.0.1:3080", no loader errors, process stays up
```

In a second Git Bash window:

```bash
echo "--- [d] service is listening ---"
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3080   # expected: 200
```

Open `http://127.0.0.1:3080` in a browser and verify the UI:

```
--- [e] UI verification ---
1. A "+" button appears to the left of the input row
2. Clicking "+" opens a menu with three items: Handwriting, Screenshot, LaTeX Editor
3. Settings → Math Input shows five controls (mode, beam, provider, debounce, language)
4. Type \[x^2\] in the composer — a KaTeX chip renders below
```

Back in the \[c] window, `Ctrl+C` to stop the service, then clean up:

```bash
echo "--- [f] cleanup: remove the plugin ---"
npx @deepseek-ai/dsh plugin --profile web remove dsh-math-input; echo "exit=$?"
cat ~/.dsh/profiles/web/package.json
# expected: bundles back to base entries; dsh-math-input gone from dependencies
```

### macOS / Linux

```bash
PROJECT="$(pwd)"          # ← run from the repo root; or use an absolute path
cd "$PROJECT"

echo "--- [a] install the local package ---"
npx @deepseek-ai/dsh plugin --profile web add "file:$PROJECT"; echo "exit=$?"

echo "--- [b] confirm registration in the bundles layer ---"
cat ~/.dsh/profiles/web/package.json

echo "--- [c] cold boot (the original crash point) ---"
npx @deepseek-ai/dsh web --no-open
# expected: same as Windows; keep it running, run [d] in another terminal:
#   curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3080   # expected: 200
# then open http://127.0.0.1:3080 in a browser for [e] UI verification (same checklist as Windows)
# then Ctrl+C in the [c] window:

echo "--- [f] cleanup: remove the plugin ---"
npx @deepseek-ai/dsh plugin --profile web remove dsh-math-input; echo "exit=$?"
cat ~/.dsh/profiles/web/package.json
```

***

## Pass criteria

| step | pass                                                           | failure signal                                                                          |
| ---- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| \[a] | `exit=0`, pnpm install succeeds                                | pnpm error / reconcile warning `declares no dsh.bundle`                                 |
| \[b] | bundles contain `dsh-math-input`                               | missing (the `dsh.bundle.patch` declaration is broken)                                  |
| \[c] | prints the listen address, stays up without errors             | `failed to import loader entry dsh-math-input` / `ERR_MODULE_NOT_FOUND` / process exits |
| \[d] | HTTP 200                                                       | connection refused                                                                      |
| \[e] | "+" button visible, menu opens, settings page shows Math Input | "+" button absent (Host loaded but Client not discovered); settings section missing     |
| \[f] | `exit=0`, profile restored                                     | leftover dependency or bundle                                                           |

Boot crashes happen early in tree composition — \~10 clean seconds at \[c] is a
pass. A missing Client (\[e] failure with \[c] pass) means `dsh.client` in
`package.json` is malformed or the `inject` list is wrong.

***

## Real `github:` re-verification after push

Once the commit is pushed to GitHub, swap \[a] for the real spec and re-run
\[b]–\[f] to cover the tarball-fetch step:

```bash
npx @deepseek-ai/dsh plugin --profile web add "github:<owner>/dsh-math-input"
```

***

## Design notes

- **Why not rely on the overlay smoke test alone?** The overlay injects the
  Host entry by absolute path, bypassing `node_modules` resolution. It verifies
  that the compiled code runs, but not that the package's `main`/`exports`
  contract is correct for a real `plugin add` install. This guide is the only
  test that catches a broken bare-name → relative-path regression.

- **Why the UI check matters for this plugin**: unlike a pure CLI tool,
  `dsh-math-input` has both a Host entry (registers settings service) and a
  Client half (React UI with the "+" button). A clean cold boot only proves the
  Host loaded; the \[e] UI check proves the Client was discovered via
  `dsh.client` and is rendering.

- **Maintenance rule**: any change touching `cordis.patch.yml`, `main`,
  `exports`, `dsh.bundle`, or `dsh.client` must re-run this guide.

