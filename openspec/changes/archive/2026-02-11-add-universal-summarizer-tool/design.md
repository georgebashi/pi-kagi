## Context

The pi-kagi extension already ships a `web_search` tool backed by Kagi's Search API. The codebase follows a clean pattern: `kagi-api.ts` handles HTTP and response parsing, tool modules (e.g., `web-search.ts`) handle parameter schemas, execution, and TUI rendering, and `index.ts` registers everything.

Kagi exposes a Universal Summarizer API at `POST https://kagi.com/api/v0/summarize` that accepts a URL (or text) and returns a prose summary or bulleted takeaways. It uses the same `Authorization: Bot <token>` header as the search API. The API supports parameters: `url`, `summary_type` ("summary" | "takeaway"), and `target_language` (ISO language code). The response includes `output` (summary text) and `tokens` (token count).

## Goals / Non-Goals

**Goals:**
- Provide a `summarize` tool the LLM can call to get a concise summary of any URL
- Support both summary types: paragraph prose (`summary`) and bullet points (`takeaway`)
- Support optional target language for cross-language summarization
- Follow the exact same patterns as the existing `web_search` tool (error handling, TUI rendering, truncation)
- Use the same `KAGI_API_KEY` — no additional configuration

**Non-Goals:**
- Summarizing raw text input (only URL-based summarization; text input can be a future enhancement)
- Caching summaries across invocations
- Streaming partial summaries (the API is request/response)
- Summarizing local files (URLs only)

## Decisions

### 1. Tool naming

**Decision:** `summarize` (not `kagi_summarize` or `universal_summarizer`).

**Rationale:** Consistent with the `web_search` convention — the tool name is action-oriented and hides the backend. The LLM doesn't need to know it's powered by Kagi.

**Alternative considered:** `kagi_summarize` — unnecessarily couples the tool name to the provider.

### 2. Parameter design

**Decision:** Three parameters:
- `url` (string, required) — the URL to summarize
- `summary_type` (enum: "summary" | "takeaway", optional, default "summary") — output format
- `target_language` (string, optional) — ISO language code for the summary output

**Rationale:** Maps directly to the Kagi API parameters. Keeping `summary_type` optional with a sensible default means most calls are just `summarize({ url: "..." })`. Target language is optional for the occasional cross-language use case.

**Alternative considered:** Adding a `max_length` parameter — Kagi's API doesn't support this, so it would be misleading.

### 3. API client function

**Decision:** Add a `kagiSummarize` function in `kagi-api.ts` alongside the existing `kagiSearch`.

**Rationale:** Keeps all Kagi HTTP logic in one place. Same error handling pattern: return a discriminated union (`{ ok: true, ... } | { ok: false, error: string }`).

### 4. Output format

**Decision:** Return the summary text directly as the tool content. Include metadata (token count, summary type, URL) in the `details` object for TUI rendering.

**Rationale:** The LLM just needs the summary text. Metadata is useful for the user viewing the TUI but shouldn't clutter the LLM's context.

### 5. Truncation

**Decision:** Apply the same `truncateHead` with `DEFAULT_MAX_BYTES` / `DEFAULT_MAX_LINES` as web search, writing the full output to a temp file if truncated.

**Rationale:** Summaries are typically short (a few paragraphs or bullet points), so truncation will rarely trigger. But applying it defensively follows the existing pattern and prevents context blowout on extremely long documents.

### 6. File structure

**Decision:** New file `summarize.ts` following the exact pattern of `web-search.ts`.

```
pi-kagi/
├── index.ts              # Updated: registers both tools
├── kagi-api.ts           # Updated: adds kagiSummarize
├── web-search.ts         # Unchanged
├── summarize.ts          # New: summarize tool definition
└── ...
```

### 7. TUI rendering

**Decision:** Custom `renderCall` and `renderResult` matching the web search style:
- **Call:** `summarize "https://..." (takeaway)` — show URL and type
- **Result:** Show summary type, token count; expanded view shows the full summary text

## Risks / Trade-offs

- **[Summarizer API cost]** → The API charges per token ($0.03/1K tokens). No mitigation beyond the LLM's own judgment on when summarization is worthwhile. The tool description will guide appropriate usage.
- **[Long response times]** → Summarizing large documents can be slow. The tool runs as a normal async call; the LLM (and user) will wait. No timeout beyond Node's default fetch timeout.
- **[URL accessibility]** → Some URLs may be behind paywalls, require auth, or be otherwise inaccessible to Kagi. The API error response will be surfaced clearly to the LLM.
