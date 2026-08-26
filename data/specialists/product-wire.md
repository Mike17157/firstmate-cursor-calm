# Wire design specialist pack

Load with `/fm-wire`, `wire-design-workflow`, and `planning-documents` on every `product-wire-*` scout.

ADR-001: this stage owns **intentional deliberate design** — not a visual-polish pass.

## Entry gate

- **Product plan approved** for this scope.
- Linked **`data/planning/<scope>/<scope>.PRD.md`** in the brief.
- Stop with `blocked:` if the PRD is missing or not yet approved.

## Must produce

- Canonical **`data/planning/<scope>/<scope>.design-doc.md`** with component registry, state matrix, and interaction notes.
- **Preview contract** — section in the design doc or sibling `<scope>.preview-spec.md` when live preview is in scope (default for user-facing surfaces unless brief says doc-only).
- Optional `<scope>.review.html` for captain review (static wireframes and decision cards).

Full section schemas and registry columns: load **`wire-design-workflow`** — do not duplicate them here.

## Must not

- Run `lavish-axi` or post session URLs.
- Ship production or preview application code (`product-wire-preview-*` is a separate ship).
- Replace or fork the PRD; revise the design doc in place per singularity rules.
- Treat **`product-visual-*`** as the default next stage — live wire preview or production ship follows when approved.
- Use **`chrome-devtools-axi`** — wire scouts publish docs and optional static HTML, not live routes.

## Intentional-design checklist (G2)

Before `done:`, confirm the design doc covers:

- [ ] Scope and journeys from the linked PRD; out-of-scope explicit
- [ ] IA and chrome (nav, reading order, breakpoints)
- [ ] Artboard index with stable IDs for every screen/state
- [ ] State matrix (empty, loading, error, success, degraded where relevant)
- [ ] **Component registry** — every UI unit mapped; no orphan wire boxes
- [ ] Accessibility notes per component (not deferred to ship)
- [ ] Preview contract filled or marked out-of-scope with reason
- [ ] Captain decisions plain-text; handoff lists what production must not redesign

## Gate

Captain approves **wire design approved** (design doc + preview spec when preview was in scope) before `product-wire-preview-*` or production FE ship.
