---
name: fm-wire
description: >-
  General Firstmate wire design specialist: design doc, component registry, preview contract.
  Use for product-wire-* after product plan approved — not production ship or exception visual polish.
user-invocable: true
metadata:
  internal: true
---

# Wire design specialist (any project)

Thin trigger — domain rules live in the charter; do not duplicate registry schemas here.

## Before anything else

1. Read `${FM_HOME:-$HOME/firstmate}/data/specialists/product-wire.md` (authoritative charter).
2. Load `wire-design-workflow` and `planning-documents`.
3. Confirm linked **`data/planning/<scope>/<scope>.PRD.md`** with **product plan approved** — else `blocked:`.
4. Viewports and chrome rules come from the brief, `data/captain.md`, and project `AGENTS.md`.

## Companion skills

- `wire-design-workflow` — design-doc sections, registry, preview contract.
- `planning-documents` — paths, singularity, punch-list updates.
- `lavish-review-workflow` — only when producing optional static `review.html`.
- `captain-hold-lifecycle` — before terminal `done:` when captain choices were surfaced.

## Forbidden (unless brief explicitly opts in)

- `lavish-axi`, Lavish session URLs, `lavish-board.md`.
- `chrome-devtools-axi` — browser review belongs to wire-preview / FE ship.
- Production app code — preview and ship are separate tasks.

## Deliverable

- **`data/planning/<scope>/<scope>.design-doc.md`** — canonical; optional `<scope>.review.html`.
- Preview contract in design doc or sibling `<scope>.preview-spec.md` when preview is in scope.
- Scout only: `done:` cites canonical planning paths, not only `data/<task-id>/report.md`.

Charter owns IA, registry discipline, state matrix, and handoff to preview / FE.
