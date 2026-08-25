# Cursor Calm (fork experiment)

Cursor Calm is a **best-effort quiet mode** for a Firstmate **Cursor** primary.
It is inspired by [Pi Calm](calm.md) and is **not** a port of Pi's transcript presentation layer.

This document is the owner of the Cursor Calm capability boundary and the preference contract.
[`configuration.md`](configuration.md#cursor-calm-preference-configcursor-calm) owns the file format.
`bin/fm-cursor-calm.sh` owns the on/off mutation helper.

## Why this is not Pi Calm

Pi Calm hides tool shells, mid-turn working notes, and operational user rows by patching Pi's **presentation APIs**.
Cursor's agent hooks (`sessionStart`, `stop`, `preToolUse`, …) can inject context, follow-ups, and permissions.
They do **not** expose a supported API to collapse or hide tool-call rows in the Agent chat UI.

Third-party browser extensions that CSS-hide Cursor chat chrome are outside Firstmate's supported surface and are not used here.

## What Cursor Calm does when on

1. **Captain-facing discipline** — session start injects a short Calm contract: speak in outcomes and plans only; do not narrate tool names, internal paths, or monitoring mechanics in captain chat (same translation spirit as `AGENTS.md` section 9, tightened for Cursor).
2. **Quiet monitoring** — empty `check: rearm-resurface` recovery completes inside the stop-hook park without a captain-visible follow-up when the wake drain has nothing actionable (shared helpers in `bin/fm-wake-lib.sh`).
3. **Native Cursor hint** — the injected contract tells the captain to set Conversation / Tool Call Density toward Compact if they want Cursor's own UI to fold more tool detail.

## What it deliberately does not do

- Hide or rewrite Cursor's tool-call UI rows.
- Change model context about which tools ran (tools still execute; results still reach the model).
- Replace Pi Calm on a Pi primary (`config/calm` remains Pi-only).
- Inherit into secondmate homes (primary-local preference, same non-inheritance posture as Pi Calm).

## Preference

Home-local gitignored `config/cursor-calm` stores `on` or `off` (one line).
Absent or unrecognized → off.
Toggle with:

```sh
bin/fm-cursor-calm.sh on
bin/fm-cursor-calm.sh off
bin/fm-cursor-calm.sh status
```

## Verification

```sh
tests/fm-cursor-calm.test.sh
tests/fm-cursor-primary.test.sh
```

Live Cursor UI density remains a vendor setting; no automated test can assert chat chrome layout.
