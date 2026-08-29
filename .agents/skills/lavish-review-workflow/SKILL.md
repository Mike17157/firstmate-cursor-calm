---
name: lavish-review-workflow
description: >-
  Agent-only contract for planning and scout review surfaces. Workers author a
  self-contained review pack (all CSS/JS inlined); firstmate serves it in the
  primary session via fm-serve-review.sh / lavish-axi and relays feedback.
  Load before briefing planning scouts, after scout done before presenting to
  captain, and when reconciling scout completion gates.
user-invocable: false
metadata:
  internal: true
---

# Review workflow (worker-authored pack, firstmate-served Lavish)

## Policy

**Markdown stays canonical for plan content; the review pack is a worker deliverable; firstmate serves Lavish and never hand-builds review HTML.**

| Layer | Owner | Artifact |
| --- | --- | --- |
| Source of truth | **Worker** (scout) | `data/planning/<scope>/<scope>.PRD.md`, `.design-doc.md`, `.TRD.md`, … |
| Review pack | **Worker** (scout) | Self-contained HTML under `data/planning/<scope>/` (e.g. `<scope>.review.html`) |
| Lavish serve + poll | **Firstmate primary session** | `bin/fm-serve-review.sh <html-file>` (wraps `lavish-axi`) |
| UI fidelity | **Wire preview ship** | Live demo routes in project `web/` |

**Division of labor:** the **worker** authors the full review pack as part of the task deliverable - rich, self-contained HTML with every CSS and JS asset inlined and **zero external resource references**.
The **firstmate primary session** only serves that file (`bin/fm-serve-review.sh` / `lavish-axi`) so Lavish auto-opens for the captain, may `poll` for annotated feedback, and relays answers into chat and the canonical markdown.
Firstmate must **never** hand-build or regenerate review HTML from markdown in the primary session.

**Why (WSL white-screen, 2026-08-27):** artifacts that fetch DaisyUI / Tailwind / themes from CDNs rendered blank/white in the captain's browser when those network fetches failed.
Self-contained packs keep the review readable offline and on restricted networks.

## Self-contained inlining method

1. Author against the correct CDN snippet once (DaisyUI 5 + `themes.css` + `@tailwindcss/browser` v4 - never the legacy `cdn.tailwindcss.com` + `full.min.css` pair).
2. During authoring, **fetch those three CDN assets once** and embed them inline (`<style>` / `<script>`), then remove the external tags.
3. Verify the file has no remaining external http(s) `src` or `href` resource references (relative links, hash anchors, and `file://` are fine).
4. Serve only through `bin/fm-serve-review.sh`, which refuses non-self-contained artifacts loudly before `lavish-axi` runs.
5. Default `data-theme="luxury"` on `<html>` unless the subject project has its own design system to match.

## Worker deliverable (planning and visual-review scouts)

1. Update the canonical markdown doc (and punch list when the scope is new or extended).
2. Author the **self-contained review pack** HTML as a task deliverable when the captain will review visually.
3. Post `needs-decision:` once in plain text only if genuine captain choices remain.
4. Pass `captain-hold-lifecycle`, append `done:` naming **canonical markdown paths and the review-pack path**, then stop for teardown - unless staying alive to host an iterative Lavish loop (below).
5. Do **not** leave firstmate to invent the HTML from markdown.
6. Do **not** use `paused:` while awaiting review after teardown.

## Firstmate after scout `done` (serve only)

1. Read the worker's review-pack path (and canonical markdown under `data/planning/<scope>/`).
2. Run `bin/fm-serve-review.sh <html-file>` in the **primary session** and send the captain the **full session URL** if auto-open needs a backup.
3. Captain reviews and annotates in Lavish; **answers in chat** when that is the standing preference.
4. Firstmate may `poll` when waiting for Lavish feedback in the same turn.
5. Decisions land in the **markdown canonical doc** - Lavish is presentation, not a second source of truth.
6. Do **not** hand-author or patch the HTML in the primary session; send authorship fixes back to a worker.

## Iterative scout-hosted loop

When the captain will iterate on a visual artifact in the same investigation, prefer keeping that scout alive to host its own Lavish loop after the pack is self-contained, so investigation context stays with the author.
That scout still owns HTML revisions; every re-serve must remain self-contained.
`process-event-sources` owns arming when firstmate (not the live scout) polls via procevent.

## Forbidden

- Firstmate primary session writing or regenerating review HTML from markdown.
- Serving a pack that still references external `http(s)` CSS/JS (or any `src`/`href` http(s) resource link) - `fm-serve-review.sh` must refuse.
- Treating Lavish markup as the source of truth over canonical markdown.

## Research and non-planning scouts

- Default: markdown report only.
- When a visual comparison helps, the **worker** authors the self-contained pack; **firstmate** serves it after `done` unless the scout hosts an iterative loop.

## Intake routing

| Captain ask | Route |
| --- | --- |
| Agent roster, skills, briefs, dispatch | `pipeline-*` on **firstmate** |
| App PRD / design doc | `product-*` / `product-wire-*` on **project** |
| App implementation | `forge-*` after gates |

`bin/fm-brief.sh` scout scaffold points workers at this authorship contract; `bin/fm-serve-review.sh` owns the serve-time refusal.
`planning-documents` owns canonical planning paths and punch lists.
`captain-hold-lifecycle` remains the sole completion-gate owner.
