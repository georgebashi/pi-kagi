## 1. API Client

- [x] 1.1 Add `KagiSummarizeSuccess`, `KagiSummarizeError`, and `KagiSummarizeResponse` types to `kagi-api.ts` (discriminated union with `ok` flag, success includes `output: string` and `tokens: number`)
- [x] 1.2 Add `KagiSummarizeApiResponse` interface for the raw Kagi API response shape (with `data.output`, `data.tokens`, and `error` array)
- [x] 1.3 Implement `kagiSummarize(url: string, apiKey: string, options?: { summaryType?: "summary" | "takeaway"; targetLanguage?: string })` in `kagi-api.ts` — POST to `https://kagi.com/api/v0/summarize` with `Authorization: Bot <key>` header, JSON body with `url`, `summary_type`, and `target_language`; return discriminated union following the same error handling pattern as `kagiSearch`

## 2. Tool Definition

- [x] 2.1 Create `summarize.ts` with `createSummarizeTool()` function following the `web-search.ts` pattern
- [x] 2.2 Define `SummarizeParams` schema using Typebox: `url` (string, required), `summary_type` (optional enum "summary" | "takeaway"), `target_language` (optional string)
- [x] 2.3 Add the `TOOL_DESCRIPTION` constant with the LLM-facing description from the spec
- [x] 2.4 Define `SummarizeDetails` interface with `url`, `summaryType`, `tokens`, optional `truncation`, `fullOutputPath`, and `error` fields

## 3. Tool Execution

- [x] 3.1 Implement the `execute` function: check for `KAGI_API_KEY`, call `kagiSummarize`, return summary text as content and metadata in details
- [x] 3.2 Add output truncation using `truncateHead` with `DEFAULT_MAX_BYTES` / `DEFAULT_MAX_LINES`, write full output to temp file when truncated (same pattern as web search)
- [x] 3.3 Handle error cases: missing API key returns clear message with `isError: true`, API errors return error text with `isError: true`

## 4. TUI Rendering

- [x] 4.1 Implement `renderCall`: display tool name and URL, append summary type in parentheses if not the default "summary"
- [x] 4.2 Implement `renderResult`: show summary type and token count in collapsed view; show "Summarizing..." for partial; show full summary text in expanded view; show truncation warning and full output path if applicable

## 5. Extension Registration

- [x] 5.1 Update `index.ts` to import `createSummarizeTool` from `./summarize.ts` and register it with `pi.registerTool()`
