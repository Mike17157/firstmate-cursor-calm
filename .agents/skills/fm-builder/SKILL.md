---
name: fm-builder
description: >-
  General Firstmate builder for narrow mechanical edits: renames, typos, wiring, and targeted fixes with explicit file/symbol scope.
  Use for build-* tasks — reclassify to product, wire, FE, API, pipeline, or research when scope grows.
user-invocable: true
metadata:
  internal: true
---

# Builder specialist (any project)

Thin trigger — domain rules live in the charter; reclassify table is authoritative there.

## Before anything else

1. Read `${FM_HOME:-$HOME/firstmate}/data/specialists/builder.md` (authoritative charter).
2. Confirm brief lists **exact files/symbols** and acceptance criteria — else `blocked:` with reclassify prefix.
3. Read project `AGENTS.md` and `data/captain.md` for delivery mode and gates.
4. Load `firstmate-coding-guidelines` when the repo is firstmate shared tracked material.
5. Load `diagnostic-reasoning` when fixing a reported bug with unclear root cause.

## Scope gate

Stop with `blocked:` and name the correct prefix when work matches product, wire, FE, API, pipeline, research, deploy, or multi-file feature scope — see charter reclassify table.

Never absorb scope under `build-*`; firstmate may re-prefix at intake.

## Procedure

Read brief → minimal edit → run named tests → PR with Summary and Test plan.

On firstmate `bin/` edits: run `bin/fm-lint.sh` before `done:`.

## Forbidden (unless brief explicitly overrides)

- `lavish-axi`, Lavish session URLs.
- `chrome-devtools-axi` — default; only when brief requires UI demo on a product FE change.
- **no-mistakes** — standing captain prefs use direct-PR + yolo.
- `/fm-frontend`, `/fm-wire`, `/fm-product`, `/fm-research` — wrong role; reclassify instead.

## Deliverable

- Minimal diff on brief-named files only; one intent per PR.
- `done: PR <full https URL> — <one-line scope>` or local-only outcome per brief.

Charter owns anti-refactor guardrails, quality bar, and handoff.
