---
name: lavish-review-workflow
description: >-
  Agent-only contract for planning and scout review surfaces. Default: canonical
  markdown from workers; Lavish hosted by firstmate in the primary session for
  captain visual review. Workers never run lavish-axi or author review HTML.
  Load before briefing planning scouts, after scout done before presenting to
  captain, and when reconciling scout completion gates.
user-invocable: false
metadata:
  internal: true
---

# Planning review workflow (Lavish default, captain-hosted)

## Policy

**Markdown is canonical; Lavish is the standard visual review surface; the captain hosts via firstmate.**

| Layer | Owner | Artifact |
| --- | --- | --- |
| Source of truth | **Worker** (scout) | `data/planning/<scope>/<scope>.PRD.md`, `.design-doc.md`, `.TRD.md`, … |
| Visual review | **Firstmate primary session** | Lavish session URL from `npx -y lavish-axi <html-file>` |
| UI fidelity | **Wire preview ship** | Live demo routes in project `web/` |
| Static HTML export | **Optional** | `lavish-axi export` or rare fallback only - not the worker default |

**Captain hosts Lavish:** only the **firstmate primary session** (captain's conversation home) runs `lavish-axi`, opens the session URL for the captain, and may `poll` when collecting annotated feedback.
**Workers and crewmates never host Lavish** - no worker `lavish-axi`, no worker-posted session URLs, no procevent Lavish, no staying alive for review.

**Why:** workers should think about **content**, not page layout; Lavish playbooks give firstmate a structured visual layer without splitting agent attention across HTML containers and product decisions.

## Worker deliverable (all planning scouts)

1. Update the canonical markdown doc per `planning-documents`.
2. Update `<scope>.punch-list.md` when the scope is new or extended.
3. Post `needs-decision:` once in plain text only if genuine captain choices remain.
4. Pass `captain-hold-lifecycle`, append `done:` with **canonical markdown paths**, stop for teardown.
5. Do **not** write `review.html`, `lavish-board.md`, or run `lavish-axi`.
6. Do **not** use `paused:` while awaiting review.

## Firstmate after scout `done` (mandatory when visual review helps)

1. Read canonical markdown under `data/planning/<scope>/`.
2. Build a Lavish HTML artifact using **`npx -y lavish-axi design`** for the **correct CDN snippet** (DaisyUI 5 + Tailwind browser v4 + `themes.css` - never `cdn.tailwindcss.com` + `full.min.css`, which renders unstyled).
   Default **`data-theme="luxury"`** on `<html>` unless the subject project has its own design system to match.
3. Run `npx -y lavish-axi <html-file>` in the **primary session** and send the captain the **full session URL**.
4. Captain reviews and annotates in Lavish; **answers in chat** (numbered options per `data/captain.md`).
   Firstmate may `poll` when waiting for Lavish feedback in the same turn.
5. Decisions stay in the **markdown canonical doc** - Lavish is presentation, not a second source of truth.
6. Questions to the captain name decision ID, options, and consequence.
7. Teardown already happened before Lavish opens.

Do **not** default to `bin/fm-planning-review-open.sh` / static `review.html` when Lavish is available unless export/offline is explicitly required.

## Forbidden on workers (always)

- Any `lavish-axi` invocation or Lavish session URL in status or report.
- Writing `<scope>.review.html` or `lavish-board.md` as the primary visual deliverable.
- Arming `bin/fm-procevent-lavish.sh`.
- `paused:` while awaiting review.
- Staying alive after `done:`.

## Research and non-planning scouts

- Default: markdown report only.
- When a visual comparison helps, **firstmate** still hosts Lavish after teardown - workers do not.

## Intake routing

| Captain ask | Route |
| --- | --- |
| Agent roster, skills, briefs, dispatch | `pipeline-*` on **firstmate** |
| App PRD / design doc | `product-*` / `product-wire-*` on **project** |
| App implementation | `forge-*` after gates |

`bin/fm-brief.sh` scout scaffold and `data/captain.md` "Planning review" record this home's standing preference.
`captain-hold-lifecycle` remains the sole completion-gate owner; this skill owns only Lavish presentation ownership and worker forbids.
