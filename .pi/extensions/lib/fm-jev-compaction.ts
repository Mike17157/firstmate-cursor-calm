import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

type FastQuestion = {
  type: "noul";
  instructions: string;
};

type FastAnswer = {
  noul: number;
  type?: "noul";
};

type FastResponse = {
  answers: Record<string, FastAnswer>;
};

type FastAsker = {
  ask(
    state: unknown,
    questions: Record<string, FastQuestion>,
  ): Promise<FastResponse>;
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
  compact(
    messages: readonly FastMessage[],
    asker: FastAsker,
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

type JevProvider = "typesafe" | "openrouter";

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
  provider?: JevProvider;
  model?: string;
  apiKey?: string;
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
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL = "typesafe/jev-1.13";
const DEFAULT_TYPESAFE_MODEL = "jev-latest";
const OPENROUTER_SYSTEM_PROMPT = [
  "You are Jev, a deterministic context-compaction decision service.",
  "The user message contains a whole coding-assistant conversation state and noul questions.",
  "Answer every question with a probability from 0 through 1 that its item must stay.",
  "Return only one JSON object with this exact shape: {\"answers\":{\"question_key\":{\"type\":\"noul\",\"noul\":0.0}}}.",
  "Use every question key exactly once, do not add prose or Markdown, and do not rewrite the conversation.",
].join(" ");
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
const SENSITIVE_KEY = /(?:api[_-]?key|access[_-]?key|secret|token|password|passwd|authorization|credential|private[_-]?key|client[_-]?secret)/iu;
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
  for (const [key, item] of Object.entries(value)) {
    copy[key] = SENSITIVE_KEY.test(key) ? REDACTED : redactValue(item, seen);
  }
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

function extensionRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
}

function configDirectory(): string {
  const home = process.env.FM_HOME || process.env.FM_ROOT_OVERRIDE || extensionRoot();
  return process.env.FM_CONFIG_OVERRIDE || resolve(home, "config");
}

function readSetting(name: string): string | undefined {
  try {
    const contents = readFileSync(resolve(configDirectory(), name), "utf8");
    for (const raw of contents.split(/\r?\n/u)) {
      const line = raw.replace(/#.*$/u, "").trim();
      if (line) return line;
    }
  } catch {
    // Missing local config uses the environment fallback.
  }
  return undefined;
}

function configuredValue(file: string, environment: string): string | undefined {
  return readSetting(file) || process.env[environment]?.trim() || undefined;
}

function parseProvider(value: string | undefined): JevProvider | undefined {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "typesafe" || normalized === "typesafe-direct") return "typesafe";
  if (normalized === "openrouter") return "openrouter";
  return undefined;
}

function resolveProvider(options: JevCompactionOptions): JevProvider | undefined {
  const configured = options.provider
    ? parseProvider(options.provider)
    : parseProvider(configuredValue("jev-provider", "FM_JEV_PROVIDER"));
  if (configured) return configured;
  if (options.provider || readSetting("jev-provider") || process.env.FM_JEV_PROVIDER) return undefined;
  return process.env.OPENROUTER_API_KEY || readSetting("openrouter-api-key")
    ? "openrouter"
    : "typesafe";
}

function resolveModel(provider: JevProvider, options: JevCompactionOptions): string {
  return options.model?.trim() ||
    configuredValue("jev-model", "FM_JEV_MODEL") ||
    (provider === "openrouter" ? DEFAULT_OPENROUTER_MODEL : DEFAULT_TYPESAFE_MODEL);
}

function resolveApiKey(provider: JevProvider, options: JevCompactionOptions): string {
  return options.apiKey?.trim() ||
    readSetting("jev-api-key") ||
    readSetting(provider === "openrouter" ? "openrouter-api-key" : "typesafe-api-key") ||
    process.env[provider === "openrouter" ? "OPENROUTER_API_KEY" : "TYPESAFE_API_KEY"]?.trim() ||
    "";
}

function parseJsonResponse(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const unfenced = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/iu, "").replace(/\s*```$/u, "")
    : trimmed;
  const parsed: unknown = JSON.parse(unfenced);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("OpenRouter returned a non-object response");
  }
  return parsed as Record<string, unknown>;
}

function openRouterContent(value: unknown): string {
  const choices = record(value).choices;
  const choice = Array.isArray(choices) ? record(choices[0]) : {};
  const message = record(choice.message);
  if (typeof message.content === "string") return message.content;
  if (!Array.isArray(message.content)) return "";
  return message.content.map((part) => {
    if (typeof part === "string") return part;
    return typeof record(part).text === "string" ? record(part).text as string : "";
  }).join("");
}

class OpenRouterJevAsker implements FastAsker {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetcher: FetchLike;

  constructor(apiKey: string, model: string, fetcher: FetchLike) {
    this.apiKey = apiKey;
    this.model = model;
    this.fetcher = fetcher;
  }

  async ask(state: unknown, questions: Record<string, FastQuestion>): Promise<FastResponse> {
    const response = await this.fetcher(OPENROUTER_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: OPENROUTER_SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify({ state, questions }) },
        ],
      }),
    });
    const responseText = await response.text();
    if (!response.ok) throw new Error(`OpenRouter request failed (${response.status})`);
    const parsed = parseJsonResponse(openRouterContent(JSON.parse(responseText)));
    const answers = record(parsed.answers);
    for (const key of Object.keys(questions)) {
      const answer = record(answers[key]);
      if (
        answer.type !== undefined && answer.type !== "noul" ||
        typeof answer.noul !== "number" ||
        !Number.isFinite(answer.noul) ||
        answer.noul < 0 ||
        answer.noul > 1
      ) {
        throw new Error(`Invalid OpenRouter Jev answer for ${key}`);
      }
    }
    return { answers: answers as Record<string, FastAnswer> };
  }
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
  const provider = resolveProvider(options);
  const apiKey = provider ? resolveApiKey(provider, options) : "";
  if (!provider || !apiKey || options.signal?.aborted) return undefined;

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
  const model = resolveModel(provider, options);
  const compactOptions = {
    goal: options.goal ? redactText(options.goal) : undefined,
    keepThreshold,
    preserveRecentMessages,
    maxStateTokens,
    maxRequestTokens,
    truncateHeadChars,
  };

  try {
    options.signal?.throwIfAborted();
    const fastJev = await loadFastJev();
    const scored = provider === "openrouter"
      ? await fastJev.compact(
        redacted,
        new OpenRouterJevAsker(apiKey, model, withAbort(fetchFn, options.signal)),
        compactOptions,
      )
      : await fastJev.compactMessages(redacted, {
        ...compactOptions,
        apiKey,
        model,
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
