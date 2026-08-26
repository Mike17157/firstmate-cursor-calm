# Wire preview specialist pack

Load with `/fm-frontend` and `wire-design-workflow` on every `product-wire-preview-*` ship.

ADR-001: live stub pages are the default design review surface — not a separate visual-polish scout.

## Entry gate

- **Wire design approved** for this scope.
- Linked **`data/planning/<scope>/<scope>.design-doc.md`** and **`<scope>.preview-spec.md`** (or equivalent preview section).
- Stop with `blocked:` if either doc is missing or wire approval is not recorded.

## Must produce

- **Preview routes** in the project `web/` per the preview contract — stub fixtures only.
- PR with demo URLs and a Test plan listing every route opened.
- Evidence that mapped components render without inventing registry entries.

Route and fixture schemas: load **`wire-design-workflow`** preview-contract section.

## Must not

- Redesign IA, chrome, or the component registry — new `product-wire-*` instead.
- Expand into full feature ship — production scope is a follow-up `forge-web-*` / `frontend-*` task.
- Skip tests or demo commands the project `AGENTS.md` requires for FE PRs.
- Dispatch **`product-visual-*`** as a routine follow-up — only when the captain explicitly requests polish beyond wire + preview.

## Browser evidence

**Required on project work:** invoke **`chrome-devtools-axi`** — open every preview route; capture layout notes for the PR Test plan.

**Not for:** `pipeline-*` on the firstmate repo.

## Gate

**Wire design approved** (captain signed off doc + preview pages when preview was in scope) unlocks production FE ship for the same surfaces.
