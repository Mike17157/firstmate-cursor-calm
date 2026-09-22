#!/usr/bin/env bash
# Live Jev compaction verification for the Pi extension adapter.
#
# This intentionally requires OPENROUTER_API_KEY and reaches the real OpenRouter
# chat-completion endpoint with the TypeSafe Jev model. It proves redaction,
# request bounds, verbatim user and assistant text, tool-only reduction, and
# native-fallback behavior without replacing the Jev transport with a fake.
set -u

if [ "${FM_JEV_LIVE_E2E:-0}" != 1 ]; then
  echo "skip: set FM_JEV_LIVE_E2E=1 with OPENROUTER_API_KEY to run the live Jev compaction regression"
  exit 0
fi

# shellcheck source=tests/lib.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

command -v node >/dev/null 2>&1 || fail "node is required for live Jev compaction verification"
[ -n "${OPENROUTER_API_KEY:-}" ] || fail "OPENROUTER_API_KEY is required for live Jev compaction verification"

TMP_ROOT=$(fm_test_tmproot fm-pi-jev-compaction-live)
fixture="$TMP_ROOT/fixture"
mkdir -p "$fixture/lib" "$fixture/node_modules" "$fixture/config"
cp "$ROOT/.pi/extensions/lib/fm-jev-compaction.ts" "$fixture/lib/fm-jev-compaction.ts"
cp "$ROOT/.pi/extensions/package.json" "$fixture/package.json"
[ -d "$ROOT/.pi/extensions/node_modules/fast-jev-compaction" ] || {
  printf '%s\n' "install .pi/extensions dependencies before this live guard: npm install --prefix .pi/extensions" >&2
  fail "fast-jev-compaction package is not installed"
}
ln -s "$ROOT/.pi/extensions/node_modules/fast-jev-compaction" "$fixture/node_modules/fast-jev-compaction" || {
  fail "could not link fast-jev-compaction package"
}

export FM_CONFIG_OVERRIDE="$fixture/config"
export FM_JEV_PROVIDER=openrouter
export FM_JEV_MODEL=typesafe/jev-1.13
cd "$fixture" || fail "could not enter the live Jev fixture"
node --experimental-strip-types --input-type=module <<'JS'
import { compactPreparation } from "./lib/fm-jev-compaction.ts";

const exactUser = "The user text must survive exactly, including punctuation: !? [] {}";
const exactAssistant = "The assistant text must survive exactly, including a path: src/generated/output.ts";
const secret = "sk-live-jev-compaction-secret-9f3a";
const oldResult = `stale output ${"x".repeat(4000)} ${secret}`;
const messages = [
  { role: "user", content: [{ type: "text", text: exactUser }] },
  {
    role: "assistant",
    content: [
      { type: "text", text: exactAssistant },
      { type: "toolCall", id: "jev-live-call", name: "read", arguments: { file_path: "src/a.ts", token: secret } },
    ],
  },
  { role: "toolResult", toolCallId: "jev-live-call", toolName: "read", content: [{ type: "text", text: oldResult }], isError: false },
];

const requests = [];
const realFetch = globalThis.fetch;
const fetchSpy = async (url, init) => {
  requests.push({ url, init });
  return realFetch(url, init);
};
const result = await compactPreparation(
  {
    firstKeptEntryId: "jev-live-tail",
    tokensBefore: 12345,
    messagesToSummarize: messages,
    turnPrefixMessages: [],
  },
  { fetch: fetchSpy, keepThreshold: 0.9, preserveRecentMessages: 0, maxStateTokens: 25000, maxRequestTokens: 30000 },
);
if (!result) throw new Error("real OpenRouter Jev returned no usable reduction");
if (requests.length !== result.details.requests) throw new Error("Jev request count was not recorded");
for (const request of requests) {
  if (request.url !== "https://openrouter.ai/api/v1/chat/completions") throw new Error("unexpected Jev endpoint");
  const body = JSON.parse(request.init.body);
  if (body.model !== "typesafe/jev-1.13") throw new Error("configured Jev model was not used");
  const prompt = JSON.parse(body.messages[1].content);
  const serialized = JSON.stringify(prompt);
  if (serialized.includes(secret)) throw new Error("secret reached the real Jev request");
  if (serialized.length > 180000) throw new Error("Jev request exceeded its safety bound");
}
if (!result.summary.includes(exactUser) || !result.summary.includes(exactAssistant)) {
  throw new Error("user or assistant text was not preserved verbatim");
}
if (result.details.method !== "fast-jev-compaction") throw new Error("unexpected compaction method");
if (result.details.reductionRatio < 0.25) throw new Error("Jev reduction was below the safety threshold");
if (result.details.requests < 1 || result.details.stateTokens < 1) throw new Error("Jev request state was not recorded");
const savedKey = process.env.OPENROUTER_API_KEY;
delete process.env.OPENROUTER_API_KEY;
const missingKey = await compactPreparation(
  { firstKeptEntryId: "missing-key", tokensBefore: 1, messagesToSummarize: messages, turnPrefixMessages: [] },
);
if (missingKey !== undefined) throw new Error("missing credentials did not use native fallback");
process.env.OPENROUTER_API_KEY = savedKey;
const aborted = new AbortController();
aborted.abort();
const abortedResult = await compactPreparation(
  { firstKeptEntryId: "aborted", tokensBefore: 1, messagesToSummarize: messages, turnPrefixMessages: [] },
  { provider: "openrouter", apiKey: "unused-after-abort", signal: aborted.signal },
);
if (abortedResult !== undefined) throw new Error("aborted Jev request did not use native fallback");
console.log(`live OpenRouter Jev compaction passed: ${result.details.requests} request(s), state ~${result.details.stateTokens} tokens`);
JS
pass "Pi Jev compaction uses the real OpenRouter TypeSafe Jev transport and preserves text while reducing tool data"
