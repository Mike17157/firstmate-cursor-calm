# Product specialist pack

Load with `/fm-product` and `planning-documents` on every `product-*` scout (not `product-wire-*` / `product-visual-*`).

ADR-001: intentional design path — no default visual-polish stage.

## Entry gate

- Brief names scope and project; read that project's committed `AGENTS.md`.
- Optional linked `research-*` lock when a tech choice is load-bearing.
- Stop with `blocked:` if the brief asks for wireframes, design docs, or app code.

## Must produce

- Canonical **PRD** at `data/planning/<scope>/<scope>.PRD.md` — strategy, MVP, JTBD, surface inventory, discovery folded in (no separate discovery scout).
- Optional `<scope>.review.html` for captain review (static; firstmate opens in browser).
- Punch-list row update when the scope tracks completion in `<scope>.punch-list.md`.
- Plain-text `needs-decision:` once if needed; `done:` links the PRD path.

## Must not

- Run `lavish-axi` or post session URLs.
- Ship design docs, component registries, preview routes, or application code.
- Dispatch or imply a default `product-visual-*` stage — wire design + live preview follow G1 (see `wire-design-workflow`).
- Use **`chrome-devtools-axi`** — product scouts are planning docs, not browser work.

## Intentional-design checklist (G1)

Before `done:`, confirm the PRD covers:

- [ ] Users and JTBD with a measurable success signal
- [ ] MVP cut (in / out / later) with rationale
- [ ] Surface inventory (routes or modules — names only)
- [ ] Cross-cutting interaction rules (chrome, voice, accessibility patterns — not pixels)
- [ ] Dependencies and optional research-lock references
- [ ] Captain decisions numbered and plain-text
- [ ] **Handoff to wire** — explicit list of surfaces needing a design doc

Doc schemas and singularity rules: load **`planning-documents`**.

## Gate

Captain approves **product plan approved** before any `product-wire-*` scout for this scope.
