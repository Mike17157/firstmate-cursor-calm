#!/usr/bin/env bash
# Cursor Calm preference helper and sessionStart injection (fork experiment).
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
# shellcheck source=tests/lib.sh
. "$ROOT/tests/lib.sh"

TMP_ROOT=$(fm_test_tmproot fm-cursor-calm)
CALM="$ROOT/bin/fm-cursor-calm.sh"

test_default_status_is_off() {
  local home
  home="$TMP_ROOT/default"
  mkdir -p "$home/config"
  out=$(FM_HOME="$home" FM_CONFIG_OVERRIDE="$home/config" "$CALM" status)
  [ "$out" = off ] || fail "absent preference must read off, got: $out"
  pass "cursor-calm: absent preference is off"
}

test_on_off_round_trip() {
  local home
  home="$TMP_ROOT/roundtrip"
  mkdir -p "$home/config"
  FM_HOME="$home" FM_CONFIG_OVERRIDE="$home/config" "$CALM" on >/dev/null
  [ "$(FM_HOME="$home" FM_CONFIG_OVERRIDE="$home/config" "$CALM" status)" = on ] \
    || fail "on did not persist"
  FM_HOME="$home" FM_CONFIG_OVERRIDE="$home/config" "$CALM" off >/dev/null
  [ "$(FM_HOME="$home" FM_CONFIG_OVERRIDE="$home/config" "$CALM" status)" = off ] \
    || fail "off did not persist"
  pass "cursor-calm: on/off round-trip"
}

test_sessionstart_injects_calm_contract_when_on() {
  local home out ctx
  home="$TMP_ROOT/session"
  mkdir -p "$home/bin" "$home/state" "$home/config" "$home/docs"
  cp "$ROOT/bin/fm-sessionstart-cursor.sh" "$home/bin/"
  cp "$ROOT/bin/fm-primary-scope-lib.sh" "$home/bin/"
  cat > "$home/bin/fm-sessionstart-run.sh" <<'SH'
#!/usr/bin/env bash
printf 'DIGEST_MARKER\n'
SH
  chmod +x "$home/bin/"*.sh
  git init -q "$home"
  git -C "$home" commit -q --allow-empty -m init
  : > "$home/AGENTS.md"
  printf 'on\n' > "$home/config/cursor-calm"
  printf '%s\n' "$$" > "$home/state/.lock"
  out=$(printf '{"hook_event_name":"sessionStart","session_id":"s","cursor_version":"x"}' \
    | FM_HOME="$home" bash "$home/bin/fm-sessionstart-cursor.sh" --source startup 2>/dev/null)
  ctx=$(printf '%s' "$out" | jq -r '.additional_context // empty')
  case "$ctx" in *DIGEST_MARKER*) ;; *) fail "digest missing: $ctx" ;; esac
  case "$ctx" in *'CURSOR CALM'*) ;; *) fail "calm contract missing when on: $ctx" ;; esac
  printf 'off\n' > "$home/config/cursor-calm"
  out=$(printf '{"hook_event_name":"sessionStart","session_id":"s","cursor_version":"x"}' \
    | FM_HOME="$home" bash "$home/bin/fm-sessionstart-cursor.sh" --source startup 2>/dev/null)
  ctx=$(printf '%s' "$out" | jq -r '.additional_context // empty')
  case "$ctx" in *'CURSOR CALM'*) fail "calm contract must not inject when off: $ctx" ;; esac
  pass "cursor-calm: sessionStart injects the contract only when on"
}

test_default_status_is_off
test_on_off_round_trip
test_sessionstart_injects_calm_contract_when_on
