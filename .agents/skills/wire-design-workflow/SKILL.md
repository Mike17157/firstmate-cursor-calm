---
name: wire-design-workflow
description: >-
  Agent-only contract for the deep wire design stage: in-depth design document,
  component registry mapped to wireframes, optional live preview ship, and demoted
  visual-mock stage. Load before scaffolding or briefing a product-wire-* scout or
  product-wire-preview-* ship, and at FE ship intake when wire attestation is required.
user-invocable: false
metadata:
  internal: true
---

# Wire design workflow

## Stage model

After **product plan approved**, frontend surfaces pass through **wire design** before production ship.

| Step | Prefix | Kind | Delivers |
| --- | --- | --- | --- |
| Wire design | `product-wire-*` | Scout | Deep design doc + component map + optional `<scope>.review.html` |
| Wire preview | `product-wire-preview-*` | Ship | Stub routes in `web/` that render the mapped components (browser review) |
| Visual polish | `product-visual-*` | Scout | **Exception only** - when wire + live preview are not enough |
| Production FE | `forge-web-*` / `frontend-*` | Ship | Full feature from approved wire + preview |

**Visual analog:** the captain reviews **live preview pages** (demo routes), not a separate Lavish mock stage by default.

Workers never run `lavish-axi`; see `lavish-review-workflow`.

## Wire scout report schema

Publish the authoritative **design doc** at `data/planning/<scope>/<scope>.design-doc.md` (load `planning-documents`).
The scout may also mirror content in `data/<task-id>/report.md`; backlog and `done:` must cite the canonical path.

Required sections in **`<scope>.design-doc.md`**:

1. **Scope** - surfaces and journeys from the linked product plan; out of scope explicit.
2. **IA and chrome** - nav, reading order, breakpoints; phone vs desktop rules from project prefs.
3. **Artboard index** - stable IDs (`AB-<surface>-<nn>`) for every screen/state; mirror in `<scope>.review.html` when a visual pack exists.
4. **State matrix** - per artboard: empty, loading, error, success, offline/degraded where relevant.
5. **Component registry** - table mapping every UI piece to wire regions (see below).
6. **Interaction notes** - focus order, gestures, PTT/voice hooks when in scope, shared chrome rules.
7. **Preview contract** - when live preview is in scope (default for user-facing surfaces unless brief says doc-only).
8. **Captain decisions** - plain-text options; `needs-decision:` once if needed.
9. **Handoff** - what production ship must not redesign without a new wire scout.

## Component registry (required table)

Every row is one implementable UI unit.
No orphan wire boxes.

| Column | Content |
| --- | --- |
| `component_id` | Stable slug, e.g. `chrome-bottom-nav`, `folio-character-card` |
| `artboard_id` | Wire region reference |
| `description` | Behavior and content slots |
| `variants` | Breakpoints, density, optional states |
| `data / props` | Stub shape for preview and ship |
| `a11y` | Labels, roles, keyboard - not deferred to ship |
| `shared_with` | Other surfaces reusing this component |

Production FE and wire-preview ships implement from this table; they do not invent components not listed without a new wire scout.

## Visual review pack

Optional **`<scope>.review.html`** per `lavish-review-workflow` - wireframes as SVG/placeholder blocks, decision cards, tables.
Canonical prose stays in the design doc.

## Preview contract (section 7)

When preview is in scope, specify:

- **Routes** - e.g. `/demo/wire/<surface>` or project demo convention from `AGENTS.md`
- **Stub fixtures** - minimal JSON/fixtures per route
- **Artboards covered** - which IDs appear on each route
- **Chrome level** - real app shell vs isolated page
- **How to demo** - commands and URL for captain browser review

Doc-only wire scouts set preview to **out of scope** with reason (internal tooling, backend-only, captain waived).

## Wire preview ship (`product-wire-preview-*`)

- **Entry:** linked approved wire report (or same-iteration brief cites in-flight wire task about to complete - prefer sequential dispatch after wire `done`).
- **Prefix maps to frontend ship:** load `/fm-frontend` and this skill; paths from project `AGENTS.md`.
- **Scope:** implement preview contract only - stub data, no full API, no feature logic beyond rendering mapped components.
- **Exit:** PR with demo section listing routes; `done:` includes how to view in browser.
- **Gate phrase for downstream:** **wire design approved** (captain confirms doc + preview when preview was in scope).

## Visual stage (exception)

Dispatch `product-visual-*` only when the brief or captain explicitly needs a **polish pass** beyond wire doc + live preview (marketing visuals, net-new look exploration, token system not covered by project `AGENTS.md`).

Changing IA or the component registry requires a new `product-wire-*` scout, not visual.

## Singular wire plans

One surface scope → one `<scope>.design-doc.md`.
Revise in place; do not spawn a second wire scout for the same scope.
Supersede via ADR or an explicit revision section in the design doc.

## FE ship intake attestation

Production `forge-web-*` briefs must link:

- Approved product plan ID/report
- Approved wire report with component registry
- Preview PR URL when preview was required
- Explicit note if visual stage ran (rare)

Refuse dispatch when user-facing surface lacks wire approval.

`data/captain.md` records this home's standing stage sequence; `data/specialists/product-wire.md` is the brief paste target.
