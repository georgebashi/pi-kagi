## Context

Pi supports custom tools via its extension system (`pi.registerTool()`). Extensions are TypeScript modules loaded by `jiti` — no build step required. They can use Node.js built-ins (`node:https`, `node:fs`) and npm dependencies declared in a co-located `package.json`.

Kagi exposes a relevant REST API:
- **Search API** (`GET https://kagi.com/api/v0/search`) — returns ranked web results with title, URL, snippet, and metadata. Accepts a query string and optional parameters (limit, etc.). Requires `Authorization: Bot <token>` header.

The API is simple request/response (no streaming). Rate limits apply.

## Goals / Non-Goals

**Goals:**
- Provide a `web_search` tool that the LLM can call during a pi session
- Proper output truncation to stay within pi's 50KB / 2000-line limit
- Custom TUI rendering for compact call/result display
- Zero external npm dependencies — use `node:https` (or global `fetch` if available) for HTTP
- Clear error messages when the API key is missing or the API returns errors

**Non-Goals:**
- Streaming partial results (Kagi API is request/response)
- Proxy or fallback to other search providers
- Browser-style full page rendering or JavaScript execution
- Managing Kagi API credits or billing

## Decisions

### 1. Single-file vs. directory extension

**Decision:** Directory extension with `package.json` and `src/index.ts` entry point.

**Rationale:** Even though we have zero npm dependencies today, a directory structure with `package.json` is the standard for distributable pi extensions. It enables future dependency additions, keeps metadata (name, version, description) in one place, and supports `pi.extensions` config in `settings.json` or the `pi` field in `package.json` for entry point declaration.

**Alternative considered:** Single `.ts` file — simpler but harder to distribute and extend later.

### 2. HTTP client

**Decision:** Use Node.js global `fetch` (available in Node 18+, which pi requires).

**Rationale:** `fetch` is built-in, Promise-based, and sufficient for simple GET requests. No need for `node:https` low-level APIs or external packages like `undici`.

**Alternative considered:** `node:https` — more boilerplate for JSON parsing, no ergonomic advantage.

### 3. API key configuration

**Decision:** Read from `KAGI_API_KEY` environment variable. Fail with a clear error at tool invocation time (not at extension load).

**Rationale:** Lazy validation means the extension loads without error even if the key isn't set — the user only sees an error when they actually try to use a Kagi tool. This follows the pattern of other pi tools that validate at call time. Environment variables are the standard pi convention for API keys.

**Alternative considered:** Pi settings.json or a custom config file — adds complexity, non-standard for API keys in the pi ecosystem.

### 4. Tool naming

**Decision:** `web_search` (underscore-separated, matching pi's existing tool naming convention).

**Rationale:** Consistent with pi's snake_case tool names. The name is generic ("web_search" not "kagi_search") because the LLM doesn't need to know the backend — it just wants to search the web.

**Alternative considered:** `kagi_search` — unnecessarily exposes the implementation detail to the LLM.

### 5. Output truncation

**Decision:** Use pi's built-in `truncateHead` utility with `DEFAULT_MAX_BYTES` (50KB) / `DEFAULT_MAX_LINES` (2000). Write full output to a temp file when truncated.

**Rationale:** Follows the established pattern from pi's `truncated-tool.ts` example. Search results are naturally ordered by relevance, so truncating from the tail preserves the best results.

### 6. Extension structure

```
pi-kagi/
├── package.json          # name, version, pi.extensions entry point
├── index.ts              # Extension entry: registers the tool
├── web-search.ts         # web_search tool definition
├── kagi-api.ts           # Kagi API client (auth, fetch, error handling)
├── openspec/             # Change artifacts
└── README.md
```

## Risks / Trade-offs

- **[API key exposure]** → The key is read from environment only, never logged or included in tool output. Tool descriptions don't mention the key.
- **[Kagi API downtime / rate limits]** → Tools return clear error messages on HTTP failures. No retry logic (keep it simple; the LLM can retry itself).
- **[No raw fetch fallback]** → The extension only provides search, not full page fetching. The LLM can use other built-in tools (e.g., `bash` with `curl`) if raw page content is needed.

## Open Questions

- Should `web_search` expose Kagi's `limit` parameter to the LLM, or always use a sensible default (e.g., 10 results)? Leaning toward a fixed default to keep the tool interface simple.
- Should we add a `session_start` event handler that warns if `KAGI_API_KEY` is not set? Pros: early feedback. Cons: noisy if the user has the extension installed but doesn't always need web tools.
