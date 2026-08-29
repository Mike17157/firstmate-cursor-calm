---
name: fm-product
description: >-
  General Firstmate product specialist for any project: PRD, MVP, JTBD, and scope cuts.
  Use for product-* tasks, product proposals, roadmap cuts, or when design started without an approved product plan.
user-invocable: true
metadata:
  internal: true
---

# Product specialist (any project)

Thin trigger — domain rules live in the charter; do not duplicate schemas here.

## Before anything else

1. Read `${FM_HOME:-$HOME/firstmate}/data/specialists/product.md` (authoritative charter).
2. Load `planning-documents` and `captain-hold-lifecycle`.
3. Take project identity from the brief and that project's `AGENTS.md` — not from this skill.

## Companion skills

- `planning-documents` — canonical paths and doc types.
- `captain-hold-lifecycle` — before terminal `done:`.
- `lavish-review-workflow` — only when writing optional static `review.html`.

## Forbidden (unless brief explicitly opts in)

- `lavish-axi`, Lavish session URLs, `lavish-board.md`.
- `chrome-devtools-axi` — not a browser role.
- Application code, wire design doc, or separate discovery scout for the same scope.

## Deliverable

- **`data/planning/<scope>/<scope>.PRD.md`** — update in place; optional `<scope>.review.html`.
- Update `<scope>.punch-list.md` when opening or extending a scope.
- Scout only: no PR, no push; `done:` cites canonical planning paths.

Charter owns PRD sections, MVP cuts, captain decisions (≤3), and handoff to wire.
