## 1. Project Setup

- [x] 1.1 Create `package.json` with name `pi-kagi`, version, description, and `pi.extensions` entry pointing to `src/index.ts`
- [x] 1.2 Create `src/index.ts` extension entry point that exports a default function receiving `ExtensionAPI`
- [x] 1.3 Create `README.md` with usage instructions (install location, `KAGI_API_KEY` setup, what the tool does)

## 2. Kagi API Client

- [x] 2.1 Create `src/kagi-api.ts` with a `kagiSearch(queries: string[], apiKey: string)` function that calls `GET https://kagi.com/api/v0/search` with the `Authorization: Bot <token>` header
- [x] 2.2 Parse the Kagi Search API JSON response, extracting title, URL, and snippet from each result
- [x] 2.3 Handle HTTP error responses (non-2xx) — return structured error info without exposing the API key
- [x] 2.4 Handle network failures (fetch throws) — return a descriptive error message

## 3. web_search Tool

- [x] 3.1 Create `src/web-search.ts` exporting the tool definition with `name: "web_search"`, description, and `queries` parameter (array of strings) using `Type.Array(Type.String())`
- [x] 3.2 Implement `execute`: read `KAGI_API_KEY` from `process.env`, return clear error if missing
- [x] 3.3 Implement `execute`: call `kagiSearch()` for each query, combine results into a single numbered list formatted as `N. Title\n   URL\n   Snippet`
- [x] 3.4 Apply output truncation using pi's `truncateHead` with `DEFAULT_MAX_BYTES` / `DEFAULT_MAX_LINES`; write full output to temp file when truncated and append truncation notice

## 4. TUI Rendering

- [x] 4.1 Implement `renderCall` — show tool name and query strings in compact format
- [x] 4.2 Implement `renderResult` — show result count in collapsed view; show individual results in expanded view; handle partial/streaming state and error display

## 5. Integration & Wiring

- [x] 5.1 Wire up `web-search.ts` tool in `src/index.ts` via `pi.registerTool()`
- [x] 5.2 Test the extension end-to-end: install in `~/.pi/agent/extensions/pi-kagi/` or use `pi -e ./src/index.ts`, verify `web_search` appears in the tool list and returns results
