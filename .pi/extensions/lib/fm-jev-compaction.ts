type FastToolUse = {
  tool_use_id: string;
  tool: string;
  input: Record<string, unknown>;
};

type FastToolResult = {
  tool_use_id: string;
  text: string;
  isError?: boolean;
};

type FastMessage = {
  role: "user" | "assistant";
  text: string;
  toolUses: FastToolUse[];
  toolResults?: FastToolResult[];
};

type FastCall = {
  id: string;
  tool_use_id: string;
  tool: string;
  input: Record<string, unknown>;
  pinned: boolean;
};

type FastDecision = {
  id: string;
  action: "keep" | "drop_result" | "drop_call";
};

type FastResult = {
  messages: FastMessage[];
  decisions: FastDecision[];
  stats: {
    requests: number;
    stateTokens: number;
    stateStage: string;
  };
};

type FastJev = {
  compactMessages(
    messages: readonly FastMessage[],
    options?: Record<string, unknown>,
  ): Promise<FastResult>;
  collectToolCalls(messages: readonly FastMessage[], preserveRecentMessages: number): FastCall[];
  applyDecisions(
    messages: readonly FastMessage[],
    decisions: readonly FastDecision[],
    calls: readonly FastCall[],
    headChars: number,
  ): FastMessage[];
  messageChars(message: FastMessage): number;
};

type FetchResponse = {
  status: number;
  ok: boolean;
  text(): Promise<string>;
};

type FetchInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
};

type FetchLike = (url: string, init?: FetchInit) => Promise<FetchResponse>;

type JevPreparation = {
  firstKeptEntryId: string;
  messagesToSummarize: readonly unknown[];
  turnPrefixMessages: readonly unknown[];
  previousSummary?: string;
  tokensBefore: number;
};

type JevCompactionOptions = {
  signal?: AbortSignal;
  fetch?: FetchLike;
  goal?: string;
  minReductionRatio?: number;
  preserveRecentMessages?: number;
  maxStateTokens?: number;
  maxRequestTokens?: number;
  truncateHeadChars?: number;
  keepThreshold?: number;
};

type JevCompaction = {
  summary: string;
  firstKeptEntryId: string;
  tokensBefore: number;
  details: {
    method: "fast-jev-compaction";
    reductionRatio: number;
    requests: number;
    stateTokens: number;
    stateStage: string;
  };
};

const FAST_JEV_PACKAGE = ["fast-jev-compaction"].join("");
const DEFAULT_MIN_REDUCTION_RATIO = 0.25;
const DEFAULT_PRESERVE_RECENT_MESSAGES = 6;
const DEFAULT_MAX_STATE_TOKENS = 25_000;
const DEFAULT_MAX_REQUEST_TOKENS = 30_000;
const DEFAULT_TRUNCATE_HEAD_CHARS = 300;
const DEFAULT_KEEP_THRESHOLD = 0.5;
const REDACTED = "[REDACTED]";

const PRIVATE_KEY = /-----BEGIN[\s\S]+?PRIVATE KEY-----[\s\S]+?-----END[\s\S]+?PRIVATE KEY-----/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const URL_CREDENTIALS = /(https?:\/\/[^\s/:@]+:)[^\s@]+@/gi;
const ASSIGNMENT_SECRET = /\b(?:api[_-]?key|access[_-]?key|secret|token|password|passwd|authorization|credential|private[_-]?key|client[_-]?secret)\b\s*["']?\s*[:=]\s*["']?[^\s"'`,;}\])]+/gi;
const KNOWN_TOKEN = /\b(?:sk|pk|ghp|gho|github_pat|xox[baprs])-[A-Za-z0-9_-]{8,}\b/gi;

function redactText(text: string): string {
  return text
    .replace(PRIVATE_KEY, REDACTED)
    .replace(BEARER, REDACTED)
    .replace(URL_CREDENTIALS, `$1${REDACTED}@`)
    .replace(ASSIGNMENT_SECRET, (match) => match.replace(/([:=]\s*["']?)[^\s"'`,;}\])]+$/u, `$1${REDACTED}`))
    .replace(KNOWN_TOKEN, REDACTED);
}

function redactValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") return redactText(value);
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return REDACTED;
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, seen));
  const copy: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) copy[key] = redactValue(item, seen);
  return copy;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function blockText(value: unknown): string {
  const block = record(value);
  if (typeof block.text === "string") return block.text;
  if (typeof block.thinking === "string") return block.thinking;
  return "";
}

function contentText(value: unknown, redact: boolean): string {
  if (typeof value === "string") return redact ? redactText(value) : value;
  if (!Array.isArray(value)) return "";
  const text = value.map(blockText).filter(Boolean).join("\n");
  return redact ? redactText(text) : text;
}

function messageRole(value: Record<string, unknown>): "user" | "assistant" | "toolResult" | undefined {
  const role = value.role;
  if (role === "user" || role === "assistant" || role === "toolResult") return role;
  return undefined;
}

function toolUses(value: Record<string, unknown>, redact: boolean): FastToolUse[] {
  if (!Array.isArray(value.content)) return [];
  return value.content.flatMap((blockValue): FastToolUse[] => {
    const block = record(blockValue);
    if (block.type !== "toolCall") return [];
    const id = typeof block.id === "string" ? block.id : "";
    const tool = typeof block.name === "string" ? block.name : "";
    if (!id || !tool) return [];
    const input = record(block.arguments);
    return [{
      tool_use_id: id,
      tool,
      input: (redact ? redactValue(input) : input) as Record<string, unknown>,
    }];
  });
}

function toolResult(value: Record<string, unknown>, redact: boolean): FastToolResult | undefined {
  const id = typeof value.toolCallId === "string" ? value.toolCallId : "";
  if (!id) return undefined;
  const text = contentText(value.content, redact);
  return {
    tool_use_id: id,
    text,
    isError: value.isError === true,
  };
}

function toFastMessages(messages: readonly unknown[], redact: boolean): FastMessage[] {
  const converted: FastMessage[] = [];
  for (const raw of messages) {
    const value = record(raw);
    const role = messageRole(value);
    if (role === "toolResult") {
      const result = toolResult(value, redact);
      if (result) converted.push({ role: "user", text: "", toolUses: [], toolResults: [result] });
      continue;
    }
    if (!role) continue;
    const text = contentText(value.content, redact);
    const uses = role === "assistant" ? toolUses(value, redact) : [];
    if (text || uses.length > 0 || role === "user") {
      converted.push({ role, text, toolUses: uses });
    }
  }
  return converted;
}

function textMessage(text: string): Record<string, unknown> {
  return { role: "user", content: [{ type: "text", text }] };
}

function serializeMessages(messages: readonly FastMessage[]): string {
  const sections: string[] = [];
  for (const message of messages) {
    const label = message.role === "user" ? "User" : "Assistant";
    if (message.text) sections.push(`[${label}]\n${message.text}`);
    for (const tool of message.toolUses) {
      let input = "{}";
      try {
        input = JSON.stringify(tool.input);
      } catch {
        input = "[unserializable input]";
      }
      sections.push(`[Assistant tool call ${tool.tool_use_id}] ${tool.tool} ${input}`);
    }
    for (const result of message.toolResults ?? []) {
      sections.push(`[Tool result ${result.tool_use_id}]\n${result.text}`);
    }
  }
  return sections.join("\n\n");
}

// Pi loads this tracked extension without installing its optional package; a
// runtime import lets missing dependencies take the same native fallback path.
async function loadFastJev(): Promise<FastJev> {
  return (await import(FAST_JEV_PACKAGE)) as unknown as FastJev;
}

function withAbort(fetchFn: FetchLike, signal: AbortSignal | undefined): FetchLike {
  return async (url, init = {}) => {
    if (signal?.aborted) throw new Error("Jev compaction aborted");
    const response = await fetchFn(url, { ...init, signal });
    if (signal?.aborted) throw new Error("Jev compaction aborted");
    return response;
  };
}

function numberOption(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function compactPreparation(
  preparation: JevPreparation,
  options: JevCompactionOptions = {},
): Promise<JevCompaction | undefined> {
  if (!process.env.TYPESAFE_API_KEY || options.signal?.aborted) return undefined;

  const source = [
    ...(preparation.previousSummary ? [textMessage(preparation.previousSummary)] : []),
    ...preparation.messagesToSummarize,
    ...preparation.turnPrefixMessages,
  ];
  const original = toFastMessages(source, false);
  if (original.length === 0) return undefined;

  const preserveRecentMessages = Math.max(
    0,
    Math.floor(numberOption(options.preserveRecentMessages, DEFAULT_PRESERVE_RECENT_MESSAGES)),
  );
  const maxStateTokens = Math.max(1, numberOption(options.maxStateTokens, DEFAULT_MAX_STATE_TOKENS));
  const maxRequestTokens = Math.max(1, numberOption(options.maxRequestTokens, DEFAULT_MAX_REQUEST_TOKENS));
  const truncateHeadChars = Math.max(0, Math.floor(numberOption(options.truncateHeadChars, DEFAULT_TRUNCATE_HEAD_CHARS)));
  const keepThreshold = numberOption(options.keepThreshold, DEFAULT_KEEP_THRESHOLD);
  const minReductionRatio = numberOption(options.minReductionRatio, DEFAULT_MIN_REDUCTION_RATIO);
  const redacted = toFastMessages(source, true);
  const fetchFn = options.fetch ?? (globalThis.fetch as unknown as FetchLike);

  try {
    options.signal?.throwIfAborted();
    const fastJev = await loadFastJev();
    const scored = await fastJev.compactMessages(redacted, {
      goal: options.goal ? redactText(options.goal) : undefined,
      keepThreshold,
      preserveRecentMessages,
      maxStateTokens,
      maxRequestTokens,
      truncateHeadChars,
      fetch: withAbort(fetchFn, options.signal),
    });
    options.signal?.throwIfAborted();

    const calls = fastJev.collectToolCalls(original, preserveRecentMessages);
    const compacted = fastJev.applyDecisions(
      original,
      scored.decisions,
      calls,
      truncateHeadChars,
    );
    const charsBefore = original.reduce((sum, message) => sum + fastJev.messageChars(message), 0);
    const charsAfter = compacted.reduce((sum, message) => sum + fastJev.messageChars(message), 0);
    const reductionRatio = charsBefore === 0 ? 0 : (charsBefore - charsAfter) / charsBefore;
    if (!Number.isFinite(reductionRatio) || reductionRatio < minReductionRatio) return undefined;

    const summary = serializeMessages(compacted);
    if (!summary) return undefined;
    return {
      summary,
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
      details: {
        method: "fast-jev-compaction",
        reductionRatio,
        requests: scored.stats.requests,
        stateTokens: scored.stats.stateTokens,
        stateStage: scored.stats.stateStage,
      },
    };
  } catch {
    return undefined;
  }
}
