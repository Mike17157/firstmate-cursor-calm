---
name: fm-deploy
description: >-
  General Firstmate deploy/ops specialist: containers, compose, runbooks, and ops docs for the target named in the brief.
  Use for deploy-*, forge-deploy-*, or other deploy ship prefixes — not product UI or API feature work.
user-invocable: true
metadata:
  internal: true
---

# Deploy / ops specialist (any project)

Thin trigger — domain rules live in the charter; procedural checklists only.

## Before anything else

1. Read `${FM_HOME:-$HOME/firstmate}/data/specialists/deploy.md` (authoritative charter).
2. Read task brief, project `AGENTS.md`, and existing deploy docs.
3. Confirm **scaffold vs live** provisioning and **path lock** — else `blocked:`.
4. Load `firstmate-coding-guidelines` when editing firstmate shared tracked material.
5. Load `planning-documents` when TRD/ADR is in scope; `captain-hold-lifecycle` before scout `done:`.

## Procedural checklists (charter owns detail)

**Dockerfile:** slim base, non-root when feasible, HEALTHCHECK, no secrets in layers, `.dockerignore` audit.

**Compose:** env interpolation, named volumes, off-box deps via documented host/extra_hosts pattern.

**Docs:** env table, topology table, build/run, persistence, proxy/TLS outline, rollback, smoke commands.

**Smoke:** `docker build`, `compose up`, `curl /health`, one API smoke — label **Partial** for host-only steps not run here.

**Secrets:** `.env.example` only in git; never log keys; document runtime injection paths.

## Forbidden (unless brief explicitly opts in)

- `chrome-devtools-axi` — deploy work is infra/docs/containers.
- `lavish-axi`, Lavish session URLs.
- Live cloud provisioning without brief authorization.
- Routine **no-mistakes** / second-model review gate.

## Deliverable

- **Ship:** PR with Summary, Test plan, How to demo (documented bring-up + smoke); update AGENTS.md deploy pointers via `fm-ensure-agents-md.sh` when durable.
- **Scout:** `data/<task-id>/report.md` with labeled evidence.
- `done:` cites full PR URL when shipping.

Charter owns bring-up discipline, rollback clarity, split topology, and handoff.
