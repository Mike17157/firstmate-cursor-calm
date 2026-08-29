#!/usr/bin/env bash
# Behavior tests for bin/fm-serve-review.sh.
#
# The serve gate must refuse CDN / http(s) resource references before lavish-axi
# runs, and must pass a self-contained artifact through unchanged.
set -u

# shellcheck source=tests/lib.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

TMP_ROOT=$(fm_test_tmproot fm-serve-review)
SERVE="$ROOT/bin/fm-serve-review.sh"

test_script_parses() {
  local out rc
  out=$(bash -n "$SERVE" 2>&1); rc=$?
  expect_code 0 "$rc" "bash -n bin/fm-serve-review.sh must parse cleanly (got: $out)"
  [ -z "$out" ] || fail "bash -n bin/fm-serve-review.sh emitted unexpected output: $out"
  pass "fm-serve-review.sh: bash -n succeeds"
}

test_help_exits_zero() {
  local out rc
  set +e
  out=$("$SERVE" --help 2>&1)
  rc=$?
  set -e
  expect_code 0 "$rc" "fm-serve-review.sh --help"
  assert_contains "$out" "usage: fm-serve-review.sh" "help did not print usage"
  pass "fm-serve-review.sh: --help prints usage"
}

test_missing_file_refuses() {
  local out rc
  set +e
  out=$("$SERVE" "$TMP_ROOT/missing.html" 2>&1)
  rc=$?
  set -e
  expect_code 1 "$rc" "missing artifact must refuse"
  assert_contains "$out" "unavailable" "missing artifact stderr: $out"
  pass "fm-serve-review.sh: missing file refuses"
}

test_external_href_refuses_before_lavish() {
  local fakebin artifact out rc
  fakebin=$(fm_fakebin "$TMP_ROOT/fakebin-href")
  cat > "$fakebin/lavish-axi" <<'SH'
#!/usr/bin/env bash
echo "lavish-ran" >&2
exit 0
SH
  chmod +x "$fakebin/lavish-axi"
  artifact="$TMP_ROOT/cdn-href.html"
  cat > "$artifact" <<'HTML'
<!DOCTYPE html>
<html><head>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/daisyui@5/daisyui.css">
</head><body></body></html>
HTML
  set +e
  out=$(PATH="$fakebin:$PATH" "$SERVE" "$artifact" 2>&1)
  rc=$?
  set -e
  expect_code 1 "$rc" "CDN href must refuse"
  assert_contains "$out" "external http(s) resource references" "refuse message missing: $out"
  case "$out" in
    *lavish-ran*) fail "lavish-axi ran despite external href" ;;
  esac
  pass "fm-serve-review.sh: external href refuses before lavish-axi"
}

test_external_src_refuses_before_lavish() {
  local fakebin artifact out rc
  fakebin=$(fm_fakebin "$TMP_ROOT/fakebin-src")
  cat > "$fakebin/lavish-axi" <<'SH'
#!/usr/bin/env bash
echo "lavish-ran" >&2
exit 0
SH
  chmod +x "$fakebin/lavish-axi"
  artifact="$TMP_ROOT/cdn-src.html"
  cat > "$artifact" <<'HTML'
<!DOCTYPE html>
<html><head>
<script src='https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4/dist/index.global.js'></script>
</head><body></body></html>
HTML
  set +e
  out=$(PATH="$fakebin:$PATH" "$SERVE" "$artifact" 2>&1)
  rc=$?
  set -e
  expect_code 1 "$rc" "CDN src must refuse"
  assert_contains "$out" "external http(s) resource references" "refuse message missing: $out"
  case "$out" in
    *lavish-ran*) fail "lavish-axi ran despite external src" ;;
  esac
  pass "fm-serve-review.sh: external src refuses before lavish-axi"
}

test_self_contained_allows_anchors_file_and_relative() {
  local fakebin artifact out rc
  fakebin=$(fm_fakebin "$TMP_ROOT/fakebin-ok")
  cat > "$fakebin/lavish-axi" <<'SH'
#!/usr/bin/env bash
printf 'served:%s\n' "$1"
printf 'argc:%s\n' "$#"
i=1
for a in "$@"; do
  printf 'arg%d:%s\n' "$i" "$a"
  i=$((i + 1))
done
SH
  chmod +x "$fakebin/lavish-axi"
  artifact="$TMP_ROOT/self-contained.html"
  cat > "$artifact" <<'HTML'
<!DOCTYPE html>
<html data-theme="luxury"><head>
<style>body{color:#111}</style>
<script>console.log("inline")</script>
</head><body>
  <a href="#section">jump</a>
  <a href="file:///tmp/local.md">local</a>
  <a href="scope.PRD.md">relative</a>
</body></html>
HTML
  set +e
  out=$(PATH="$fakebin:$PATH" "$SERVE" "$artifact" --extra-flag 2>&1)
  rc=$?
  set -e
  expect_code 0 "$rc" "self-contained artifact must serve"
  assert_contains "$out" "served:$artifact" "did not exec lavish-axi with the file: $out"
  assert_contains "$out" "arg2:--extra-flag" "did not forward extra args: $out"
  pass "fm-serve-review.sh: self-contained pack serves and forwards args"
}

test_script_parses
test_help_exits_zero
test_missing_file_refuses
test_external_href_refuses_before_lavish
test_external_src_refuses_before_lavish
test_self_contained_allows_anchors_file_and_relative
