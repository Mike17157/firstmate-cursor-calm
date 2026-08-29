#!/usr/bin/env bash
# Serve a self-contained Lavish review artifact after refusing external resource refs.
#
# Usage:
#   fm-serve-review.sh <html-file> [extra lavish-axi args...]
#   fm-serve-review.sh --help
#
# Verifies the HTML artifact has no external http(s) src/href resource references,
# then execs lavish-axi with the same arguments. Refusing loudly is the point:
# a non-self-contained artifact must not reach the captain.
#
# Allowed: href="#...", file://, relative and other in-document links.
# Refused: src="http(s)://..." and href="http(s)://..." resource links
# (single or double quotes). The lavish-review-workflow skill owns authorship
# and inlining; this script is only the serve-time gate.
set -eu

usage() {
  printf 'usage: fm-serve-review.sh <html-file> [extra lavish-axi args...]\n' >&2
}

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  usage
  exit 0
fi

if [ "$#" -lt 1 ]; then
  usage
  exit 2
fi

FILE=$1
if [ ! -f "$FILE" ] || [ -L "$FILE" ]; then
  printf 'error: review artifact is unavailable: %s\n' "$FILE" >&2
  exit 1
fi

# Match src= or href= whose quoted value begins with http:// or https://.
# Deliberately narrow: relative, file://, and # anchors are allowed.
if grep -Eiq '(src|href)=["'\'']https?://' "$FILE"; then
  printf 'error: review artifact has external http(s) resource references; inline CSS/JS before serving: %s\n' "$FILE" >&2
  exit 1
fi

if ! command -v lavish-axi >/dev/null 2>&1; then
  printf 'error: lavish-axi is not on PATH\n' >&2
  exit 1
fi

exec lavish-axi "$@"
