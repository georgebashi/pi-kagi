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

## MODIFIED Requirements

### Requirement: Summarize content from a URL

The `summarize` tool SHALL accept a `url` parameter (string, required), a `summary_type` parameter (enum: "summary" | "takeaway", optional, default "summary"), an `engine` parameter (enum: "cecil" | "agnes", optional, default "cecil"), and a `target_language` parameter (string, optional). The tool SHALL send a request to the Kagi Universal Summarizer API at `POST https://kagi.com/api/v0/summarize` and return the summary text.

#### Scenario: Summarize with default engine
- **WHEN** the LLM calls `summarize` with `url: "https://example.com/article"` and no `engine` parameter
- **THEN** the tool sends a request with `engine: "cecil"` (or omits the field, using the API default)

#### Scenario: Summarize with agnes engine
- **WHEN** the LLM calls `summarize` with `url: "https://example.com/technical-paper", engine: "agnes"`
- **THEN** the tool sends a request with `engine: "agnes"` and returns a formal, technical summary

### Requirement: Custom TUI rendering for summarize calls and results

#### Scenario: Render call with non-default engine
- **WHEN** the tool call is displayed in the TUI with `engine: "agnes"`
- **THEN** it shows the engine name alongside the URL and summary type
