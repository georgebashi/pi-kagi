## Tool Description

The following is the LLM-facing description for the `summarize` tool:

```
Summarize content from a URL. Works with web pages, PDFs, videos, podcasts, and other document types. Returns a concise summary to avoid consuming excessive context on long documents.

When to use:
- Digesting long documentation pages, release notes, or changelogs
- Getting key points from a video or podcast transcript
- Summarizing a PDF or technical paper
- Understanding a lengthy discussion thread or blog post

Parameters:
- url (required): The URL to summarize
- summary_type (optional): "summary" for paragraph prose (default), or "takeaway" for a bulleted list of key points
- engine (optional): Summarization engine — "cecil" (default) for fast general-purpose summaries, "agnes" for formal, technical, analytical summaries. Use agnes for technical docs, papers, and specs.
- target_language (optional): Language code for the output (e.g., "EN", "DE", "JA"). Defaults to the document's language.
```

## ADDED Requirements

### Requirement: Summarize content from a URL

The `summarize` tool SHALL accept a `url` parameter (string, required), a `summary_type` parameter (enum: "summary" | "takeaway", optional, default "summary"), an `engine` parameter (enum: "cecil" | "agnes", optional, default "cecil"), and a `target_language` parameter (string, optional). The tool SHALL send a request to the Kagi Universal Summarizer API at `POST https://kagi.com/api/v0/summarize` and return the summary text.

#### Scenario: Summarize a web page with default settings
- **WHEN** the LLM calls `summarize` with `url: "https://example.com/long-article"`
- **THEN** the tool sends a POST request to the Kagi Summarizer API with `url` and `summary_type: "summary"` and returns the summary text as prose paragraphs

#### Scenario: Summarize a URL as takeaway bullet points
- **WHEN** the LLM calls `summarize` with `url: "https://example.com/release-notes", summary_type: "takeaway"`
- **THEN** the tool returns a bulleted list of key points from the page

#### Scenario: Summarize with a target language
- **WHEN** the LLM calls `summarize` with `url: "https://example.com/article", target_language: "DE"`
- **THEN** the tool returns the summary in German, regardless of the source document's language

#### Scenario: Summarize with default engine
- **WHEN** the LLM calls `summarize` with `url: "https://example.com/article"` and no `engine` parameter
- **THEN** the tool sends a request with `engine: "cecil"` (or omits the field, using the API default)

#### Scenario: Summarize with agnes engine
- **WHEN** the LLM calls `summarize` with `url: "https://example.com/technical-paper", engine: "agnes"`
- **THEN** the tool sends a request with `engine: "agnes"` and returns a formal, technical summary

### Requirement: Summary output is returned as plain text

The `summarize` tool SHALL return the Kagi API's `output` field directly as the tool's text content. Metadata (token count, summary type, source URL) SHALL be included in the tool's `details` object for TUI rendering but SHALL NOT be included in the text content returned to the LLM.

#### Scenario: Successful summary response
- **WHEN** the Kagi Summarizer API returns a successful response with `output` and `tokens` fields
- **THEN** the tool returns the `output` text as content, and includes `{ url, summaryType, tokens }` in the details object

### Requirement: Summary output is truncated to stay within context limits

The `summarize` tool SHALL truncate output using pi's built-in truncation utilities (`truncateHead`) with `DEFAULT_MAX_BYTES` (50KB) and `DEFAULT_MAX_LINES` (2000). When output is truncated, the full output SHALL be written to a temporary file and the truncation notice SHALL include the path to the full output.

#### Scenario: Output within limits
- **WHEN** the summary fits within 50KB and 2000 lines
- **THEN** the full summary is returned without truncation

#### Scenario: Output exceeds limits
- **WHEN** the summary exceeds 50KB or 2000 lines
- **THEN** the output is truncated, a temp file is written with the full output, and a notice is appended indicating how many lines/bytes were omitted and the path to the full output

### Requirement: Missing API key produces a clear error

When the `KAGI_API_KEY` environment variable is not set, the tool SHALL return an error message instructing the user to set the variable. The check SHALL happen at tool invocation time, not at extension load time.

#### Scenario: No API key set
- **WHEN** the LLM calls `summarize` and `KAGI_API_KEY` is not set
- **THEN** the tool returns an error: "KAGI_API_KEY environment variable is not set. Set it to your Kagi API key to use summarize."

### Requirement: API errors are reported clearly

When the Kagi Summarizer API returns a non-success HTTP status or an error response, the tool SHALL return the error information to the LLM without exposing the API key.

#### Scenario: API returns HTTP error
- **WHEN** the Kagi API responds with a non-2xx status code
- **THEN** the tool returns an error message including the status code and any error message from the response body

#### Scenario: Network failure
- **WHEN** the fetch request fails due to a network error
- **THEN** the tool returns an error message describing the failure

#### Scenario: URL is inaccessible
- **WHEN** the Kagi API cannot access the provided URL (e.g., behind a paywall or authentication)
- **THEN** the tool returns the API's error response describing the access failure

### Requirement: Custom TUI rendering for summarize calls and results

The `summarize` tool SHALL provide `renderCall` and `renderResult` functions for compact display in the TUI.

#### Scenario: Render call
- **WHEN** the tool call is displayed in the TUI
- **THEN** it shows the tool name, the URL, and the summary type (if not the default) in a compact format

#### Scenario: Render call with non-default engine
- **WHEN** the tool call is displayed in the TUI with `engine: "agnes"`
- **THEN** it shows the engine name alongside the URL and summary type

#### Scenario: Render result
- **WHEN** the tool result is displayed in the TUI
- **THEN** it shows the summary type and token count in the collapsed view, and the full summary text in the expanded view
