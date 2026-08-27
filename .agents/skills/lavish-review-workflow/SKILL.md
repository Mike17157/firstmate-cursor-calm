---
name: lavish-review-workflow
description: >-
  Agent-only contract for planning and scout review surfaces. Artifact and
  Lavish ownership are per-task: planning defaults to canonical markdown from
  workers with Lavish hosted by firstmate in the primary session; a brief may
  explicitly assign worker-owned artifacts or a worker-hosted Lavish session.
  Load before briefing planning or visual-review scouts, after scout done before
  presenting to captain, and when reconciling scout completion gates.
user-invocable: false
metadata:
  internal: true
---

# Planning review workflow (per-task ownership)

## Policy

**Canonical planning markdown is the source of truth for planning content.**
**Artifact and Lavish session ownership are decided per task**, not by a universal Markdown-only rule.

| Layer | Default owner (planning) | When the brief explicitly reassigns |
| --- | --- | --- |
| Source of truth | **Worker** → `data/planning/<scope>/…` markdown + punch lists | Still the worker; extras never replace the canonical doc |
| Visual review / Lavish | **Firstmate primary session** after teardown | **Worker** may own artifacts and/or host a Lavish session |
| UI fidelity | **Wire preview ship** → live demo routes in project `web/` | Unchanged |
| Static HTML export | Optional rare fallback (`lavish-axi export`) | Allowed when the brief names that artifact |

**Captain mediation stays coherent:** captain answers land in chat (and held tasks via `captain-hold-lifecycle`); Lavish annotations never become a second planning authority.

**Why a default exists:** planning workers should focus on content unless the task contract deliberately assigns layout or live review to them.

## Resolve ownership from the task contract

1. Read the brief (and any later steer that amends it).
2. If it **explicitly** authorizes worker-owned visual artifacts and/or a worker-hosted Lavish session, follow that contract for those surfaces.
3. Otherwise use the **planning default** below.

Silence is not permission: do not invent worker hosting because a visual deliverable would help.

## Planning default (primary-hosted Lavish)

1. Update the canonical markdown doc per `planning-documents`.
2. Update `<scope>.punch-list.md` when the scope is new or extended.
3. Post `needs-decision:` once in plain text only if genuine captain choices remain.
4. Pass `captain-hold-lifecycle`, append `done:` with **canonical markdown paths**, stop for teardown.
5. Do **not** run `lavish-axi`, publish Lavish session URLs, arm `bin/fm-procevent-lavish.sh`, write `review.html` / `lavish-board.md` as the visual deliverable, or use `paused:` awaiting review.
6. After teardown, **firstmate** may build a Lavish HTML artifact (`npx -y lavish-axi design` for the CDN snippet; DaisyUI 5 + Tailwind browser v4 + `themes.css`; default `data-theme="luxury"` unless the subject project has its own system), run `npx -y lavish-axi <html-file>` in the **primary session**, send the captain the full session URL, and `poll` in that same turn when collecting annotated feedback.

## Explicit worker-owned path

When the brief (or an amending steer) explicitly assigns worker-owned artifacts and/or a worker-hosted Lavish session:

1. Still update canonical planning markdown and punch lists when the scope is a planning scout.
2. Produce only the artifacts the contract names.
3. You may run `lavish-axi`, publish the session URL, poll/revise, and stay alive for review **only as that contract requires**.
4. Pass `captain-hold-lifecycle` before treating the investigation or visual review as complete.
5. Captain answers still close through chat / keyed holds; write durable decisions back into the canonical markdown.

## Research and non-planning scouts

- Default: markdown report only; firstmate may host Lavish after teardown when visual comparison helps.
- A brief may explicitly authorize worker-owned artifacts or a worker-hosted Lavish session the same way as above.

## Intake routing

| Captain ask | Route |
| --- | --- |
| Agent roster, skills, briefs, dispatch | `pipeline-*` on **firstmate** |
| App PRD / design doc | `product-*` / `product-wire-*` on **project** |
| App implementation | `forge-*` after gates |

`bin/fm-brief.sh` scout scaffold states the default and the explicit-permission carve-out.
`data/captain.md` "Planning review" may record this home's standing preference.
`captain-hold-lifecycle` remains the sole completion-gate owner; this skill owns ownership resolution and Lavish presentation rules only.
