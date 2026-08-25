#!/usr/bin/env bash
# Cursor Calm preference helper (fork experiment).
#
# Usage:
#   fm-cursor-calm.sh on|off|status
#
# Writes home-local gitignored config/cursor-calm as a single line "on" or "off".
# Absent or unrecognized means off. Not inherited by secondmate homes.
# docs/cursor-calm.md owns the capability boundary; this script owns the file.
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FM_HOME="${FM_HOME:-${FM_ROOT_OVERRIDE:-$(cd "$SCRIPT_DIR/.." && pwd)}}"
CONFIG="${FM_CONFIG_OVERRIDE:-$FM_HOME/config}"
FILE="$CONFIG/cursor-calm"

usage() {
  printf 'usage: fm-cursor-calm.sh on|off|status\n' >&2
  exit 2
}

[ "$#" -eq 1 ] || usage

mkdir -p "$CONFIG" || {
  echo "fm-cursor-calm: could not create $CONFIG" >&2
  exit 1
}

case "$1" in
  on|off)
    tmp=$(mktemp "$CONFIG/cursor-calm.XXXXXX") || exit 1
    if ! printf '%s\n' "$1" > "$tmp" || ! mv -f -- "$tmp" "$FILE"; then
      rm -f -- "$tmp"
      echo "fm-cursor-calm: could not write $FILE" >&2
      exit 1
    fi
    printf 'cursor-calm: %s\n' "$1"
    ;;
  status)
    val=$(head -n 1 "$FILE" 2>/dev/null || true)
    case "$val" in
      on) printf 'on\n' ;;
      *) printf 'off\n' ;;
    esac
    ;;
  *) usage ;;
esac
