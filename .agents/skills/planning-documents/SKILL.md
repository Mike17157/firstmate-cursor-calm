---
name: planning-documents
description: >-
  Agent-only catalog of standard planning document types, canonical paths, and
  naming for fleet and product work. Load before scaffolding or briefing any
  planning scout (product-*, product-wire-*, research-*, pipeline-* discovery),
  before intake deduplication, and when updating an existing plan in place.
user-invocable: false
metadata:
  internal: true
---

# Planning documents

Use **industry-standard document names**, not invented task titles or `-v2` forks.
One scope + one doc type → **one canonical file**, updated in place.

## Canonical location

```
data/planning/<scope>/
```

`<scope>` is a stable slug for the product, surface, or fleet domain - e.g. `character-forge`, `library-surface`, `agent-fleet`.

## Standard document types

| File | Document | Typical stage | Contains |
| --- | --- | --- | --- |
| `<scope>.PRD.md` | **Product Requirements Document** | `product-*` | Problem, users, MVP, roadmap, metrics, open product decisions |
| `<scope>.design-doc.md` | **Design Document** (UX/UI) | `product-wire-*` | IA, chrome, flows, state matrix, wire artboards, **component registry**, a11y |
| `<scope>.preview-spec.md` | **Preview / prototype spec** | `product-wire-preview-*` | Demo routes, stub fixtures, which artboards render where |
| `<scope>.TRD.md` | **Technical Requirements Document** | `research-*` | Tech options, constraints, benchmarks, lock recommendation |
| `<scope>.api-spec.md` | **API specification** | API research or `forge-api-*` | Endpoints, schemas, error model |
| `ADR-<nnn>-<slug>.md` | **Architecture Decision Record** | any | Context, decision, consequences (one file per decision) |
| `<scope>.punch-list.md` | **Punch list** | ongoing | **Done vs pending** - one table; links to PRD/design-doc/ADRs; update on completion |
| `<scope>.review.html` | **Review HTML** | rare / task-contract | Optional layout archive or named visual artifact - ownership per `lavish-review-workflow` |
| `assets/` | Optional images | with visual artifacts | PNG/SVG referenced by a named visual artifact |

Use the **full document name** in reports and captain chat ("PRD", "design doc", "TRD", "ADR") - not "the scout report" alone.

Canonical **markdown and punch lists** remain the planning source of truth under this catalog.
Extra visual artifacts and Lavish sessions are allowed when the task contract says so; `lavish-review-workflow` owns that ownership resolution.
Do not create `lavish-board.md` for new work.

## Singularity rules

1. **Search** `data/planning/<scope>/` and backlog before creating a new file or task.
2. **Update** the existing canonical file; reopen the same backlog item when resuming.
3. **Do not fork** `<scope>.PRD-v2.md` or parallel scouts for the same scope + doc type.
4. **Supersede** only with an explicit ADR or a PRD revision section - retire duplicate files.
5. Task folders `data/<task-id>/` may hold working notes; the **canonical** plan lives under `data/planning/`.
   Point `done:` and backlog links at the canonical path.

## Punch list (completion tracker)

Every scope has **`<scope>.punch-list.md`**.
This is the **only** official record of what is finished vs pending - do not scatter status tables through PRDs or design-docs.

```markdown
# Punch list - <scope>

| # | Item | Artifact | Status | Completed | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Product requirements locked | <scope>.PRD.md | pending / done | YYYY-MM-DD | |
| 2 | Design doc approved | <scope>.design-doc.md | pending / done | | |
| 3 | Preview reviewed | <scope>.preview-spec.md | pending / done / n/a | | |
```

- **Artifact** column links to the planning doc (clickable relative path in real files).
- Update **one row** when something completes - never re-read the whole PRD to infer status.
- Firstmate reads punch list **first** at intake; backlog is secondary.

Create or extend the punch list when opening a new scope; ship tasks check it before dispatch.

## Stage → doc mapping

| Prefix | Must produce or update |
| --- | --- |
| `product-*` | `<scope>.PRD.md`, `<scope>.punch-list.md` |
| `product-wire-*` | `<scope>.design-doc.md`, update punch list |
| `product-wire-preview-*` | Implements `<scope>.preview-spec.md` (create at wire scout if missing) |
| `research-*` | `<scope>.TRD.md` and/or `<scope>.api-spec.md` |
| `pipeline-*` (discovery) | `<scope>.PRD.md` or ADRs under `data/planning/<scope>/` |

`lavish-review-workflow` owns per-task visual and Lavish ownership; this skill owns document names and paths only.

## Examples

```
data/planning/agent-fleet/agent-fleet.PRD.md
data/planning/agent-fleet/agent-fleet.punch-list.md
data/planning/agent-fleet/ADR-001-wire-preview-gate.md
data/planning/library-surface/library-surface.design-doc.md
data/planning/vad-mobile/vad-mobile.TRD.md
```

`data/captain.md` "Planning documents" records this home's standing preference.
