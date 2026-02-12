## Tool Description

The following is the LLM-facing description for the `web_search` tool:

```
Search the web for real-time information using one or more queries. Returns ranked results with titles, URLs, and snippets.

When to use:
- Looking up documentation, APIs, libraries, or error messages you're unsure about
- Answering questions about recent events, releases, or data beyond your training cutoff
- Verifying assumptions or checking for updated best practices

Tips for effective queries:
- Write concise, keyword-focused queries — include the current year for time-sensitive topics
- Use multiple queries to cover different angles of a broad question
- Prefer specific technical terms over natural language when searching for code or docs

After using search results in your response, include a "Sources" section listing the URLs you referenced as markdown links, e.g.:
Sources:
- [Page Title](https://example.com)
```

## ADDED Requirements

### Requirement: Search the web with one or more queries

The `web_search` tool SHALL accept a `queries` parameter containing one or more search query strings. Each query SHALL be sent to the Kagi Search API. Results from all queries SHALL be combined into a single numbered list, ordered by query then by Kagi's relevance ranking within each query.

#### Scenario: Single query search
- **WHEN** the LLM calls `web_search` with `queries: ["rust async patterns"]`
- **THEN** the tool returns a numbered list of web results, each containing a title, URL, and snippet

#### Scenario: Multiple query search
- **WHEN** the LLM calls `web_search` with `queries: ["pi coding agent extensions", "kagi search API"]`
- **THEN** the tool returns results from both queries in a single numbered list, with results from the first query appearing before the second

### Requirement: Search results contain title, URL, and snippet

Each search result SHALL include the page title, the URL, and a text snippet. Results SHALL be formatted as a numbered list for easy reference by the LLM.

#### Scenario: Result format
- **WHEN** the Kagi API returns search results
- **THEN** each result is formatted as: `N. Title\n   URL\n   Snippet` where N is the result number

### Requirement: Search output is truncated to stay within context limits

The `web_search` tool SHALL truncate output using pi's built-in truncation utilities (`truncateHead`) with `DEFAULT_MAX_BYTES` (50KB) and `DEFAULT_MAX_LINES` (2000). When output is truncated, the full output SHALL be written to a temporary file and the truncation notice SHALL include the path to the full output.

#### Scenario: Output within limits
- **WHEN** search results fit within 50KB and 2000 lines
- **THEN** all results are returned without truncation

#### Scenario: Output exceeds limits
- **WHEN** search results exceed 50KB or 2000 lines
- **THEN** the output is truncated, a temp file is written with the full output, and a notice is appended indicating how many lines/bytes were omitted and the path to the full output

### Requirement: Missing API key produces a clear error

When the `KAGI_API_KEY` environment variable is not set, the tool SHALL return an error message instructing the user to set the variable. The check SHALL happen at tool invocation time, not at extension load time.

#### Scenario: No API key set
- **WHEN** the LLM calls `web_search` and `KAGI_API_KEY` is not set
- **THEN** the tool returns an error: "KAGI_API_KEY environment variable is not set. Set it to your Kagi API key to use web search."

### Requirement: API errors are reported clearly

When the Kagi Search API returns a non-success HTTP status or an error response, the tool SHALL return the error information to the LLM without exposing the API key.

#### Scenario: API returns HTTP error
- **WHEN** the Kagi API responds with a non-2xx status code
- **THEN** the tool returns an error message including the status code and any error message from the response body

#### Scenario: Network failure
- **WHEN** the fetch request fails due to a network error
- **THEN** the tool returns an error message describing the failure

### Requirement: Custom TUI rendering for search calls and results

The `web_search` tool SHALL provide `renderCall` and `renderResult` functions for compact display in the TUI.

#### Scenario: Render call
- **WHEN** the tool call is displayed in the TUI
- **THEN** it shows the tool name and the query strings in a compact format

#### Scenario: Render result
- **WHEN** the tool result is displayed in the TUI
- **THEN** it shows the number of results found, and in expanded view shows the individual results
