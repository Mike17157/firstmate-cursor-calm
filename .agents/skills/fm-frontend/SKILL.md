---
name: fm-frontend
description: >-
  General Firstmate frontend ship specialist for any project: UI paths from the brief,
  tests + demo, browser smoke via chrome-devtools-axi. Use for frontend-*, web-*,
  forge-web-*, product-wire-preview-*, or other FE ship prefixes — not backend or deploy.
user-invocable: true
metadata:
  internal: true
---

# Frontend specialist (any project)

Thin trigger — domain rules live in the charter; do not duplicate the full checklist here.

## Before anything else

1. Read `${FM_HOME:-$HOME/firstmate}/data/specialists/frontend.md` (authoritative charter).
2. For **`product-wire-preview-*`**, also read `product-wire-preview.md` and load `wire-design-workflow`.
3. For **production ship** (`forge-web-*`, `frontend-*`, `web-*`), load `wire-design-workflow` when the brief links wire; refuse user-facing ship without wire attestation.
4. Path ownership, framework, and test commands come from the brief and project `AGENTS.md`.

## Wire preview vs production

| Kind | Deliverable |
| --- | --- |
| **Wire preview** | Stub routes per preview contract; How to demo lists browser URLs |
| **Production ship** | Full feature from approved wire registry; map every `component_id` to file/route or defer with task id |

## Browser smoke (product repos)

**Required** for changed user-visible routes under `projects/<app>/`:

`open <url>` → `resize <w> <h>` → `snapshot` / `screenshot` → exercise primary interaction → record in PR Test plan.

Use phone and desktop viewports the wire specifies (often **390×844** and **1280×800**).

## Forbidden (unless brief explicitly opts in)

- `lavish-axi` — including on pipeline / firstmate repo work.
- `chrome-devtools-axi` on `pipeline-*` or firstmate-repo tooling-only tasks.
- `/no-mistakes` — captain standing default is **direct-PR**; only when brief mode says so.
- Editing paths the brief marks out of scope; unlisted components or IA changes without a new wire scout.

## Deliverable

- PR with **Summary**, **Test plan**, and **How to demo**; FE planning checklist attested (see charter References).
- Component registry parity table in PR body.
- `done: PR <full https URL>` when shipping.

Charter owns gates, checklist rows, state-matrix coverage, and handoff.
