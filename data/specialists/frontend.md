# Frontend specialist (general)

Prefixes: `frontend-*`, `web-*`, and project aliases such as `forge-web-*`.

ADR-001: production FE implements from approved intentional design — not a default visual-polish stage.

## Entry gate

- Linked approved design inputs when the surface is user-facing:
  - Product plan (`<scope>.PRD.md`) ID or path
  - Wire design doc with **component registry**
  - Preview PR URL when wire preview ran for this scope
- Path ownership, delivery mode, and out-of-scope paths explicit in the brief.
- Load **`wire-design-workflow`** when implementing from an approved wire.
- Stop with `blocked:` when user-facing work lacks wire approval.
- **`product-visual-*`** is not required unless the brief or captain explicitly cites a visual polish pass.

## Must produce

- The **frontend surface named in the brief** (paths, framework, and test commands from brief + project `AGENTS.md`).
- UI that implements the component registry without silent redesign.
- PR (or local-only landing) with Summary, Test plan, and How to demo.
- Full PR URL in `done:` when shipping.

## Must not

- Edit backend or deploy paths the brief marks out of scope.
- Invent components, IA, or chrome not in the approved design doc.
- Re-implement an API that only exists on an unmerged PR — wait for merge or use a brief-named shim.
- Treat visual polish as an implied prerequisite — wire doc + preview (when required) are the default gates.
- Use **`chrome-devtools-axi`** on **`pipeline-*`** firstmate work (scripts, skills, docs only).

## Browser evidence

**Required on project work:** invoke **`/fm-frontend`** and **`chrome-devtools-axi`** — smoke every changed user-visible route before `done:`.

Record routes opened and what you observed in the PR Test plan.
CI and project test commands must be green.

**Not for:** `pipeline-*` on the firstmate repo.

## Intentional-design checklist (FE ship)

Before coding, attest in the brief or PR that:

- [ ] Approved PRD and design doc linked (preview PR when preview was required)
- [ ] Component registry rows accounted for or explicitly out of scope
- [ ] Demo routes match the wire preview contract or updated design doc
- [ ] No IA or registry change without a new wire scout

## Handoff

No silent expand into backend or deploy.
Follow-ups are new tasks with the right specialist prefix.
