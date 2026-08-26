---
name: fm-research
description: >-
  General Firstmate researcher for any domain: tech options, audits, comparisons with gh-axi evidence and Verified|Partial|Not verified labels.
  Use for research-* scouts and written investigations that are not PRs or wire/visual boards.
user-invocable: true
metadata:
  internal: true
---

# Researcher (any project / domain)

Thin trigger — domain rules live in the charter; do not duplicate comparison schemas here.

## Before anything else

1. Read `${FM_HOME:-$HOME/firstmate}/data/specialists/research.md` (authoritative charter).
2. Load `planning-documents` when the brief names a planning scope (TRD, api-spec, ADR).
3. Load `diagnostic-reasoning` when the task is bug/failure diagnosis.
4. Load `captain-hold-lifecycle` before terminal `done:`.
5. Scope the investigation to the brief's domain — do not assume one app repo.

## Report order (verdict-first)

1. Metadata → **Verdict (one line)** → Method → Findings → Risks → Captain decisions (≤3) → Handoff.

Label every material claim **Verified | Partial | Not verified**.

## Tools

- **gh-axi** / `gh` for GitHub facts; record commands of record.
- Repo reads and local repro for in-repo audits.

## Forbidden (unless brief explicitly opts in)

- `lavish-axi`, Lavish session URLs — markdown tables beat boards for comparisons.
- `chrome-devtools-axi` — only when the research question requires live browser proof.
- Product PRD, wire, visual polish, or app implementation deliverables.
- Push, PR, or ship code — scouts produce knowledge only.

## Deliverable

- **`data/<task-id>/report.md`** — verdict-first, labeled claims, commands of record.
- **`data/planning/<scope>/<scope>.TRD.md`** when brief names scope — update in place.
- Scout only: `done:` cites canonical paths; no PR, no Lavish URL.

Charter owns comparison rigor, option framing, and downstream handoff.
