## Why

The pi-kagi extension currently only exposes web search. Kagi's Universal Summarizer API can summarize any URL — web pages, videos, podcasts, PDFs — which is highly valuable for an AI coding agent that frequently needs to digest long documents, release notes, or documentation pages. Adding a `summarize` tool lets the LLM fetch a concise summary of any URL without consuming excessive context tokens on raw page content.

## What Changes

- Add a new `summarize` MCP-style tool that accepts a URL and optional summary type (`summary` or `takeaway`) and target language
- Add a `kagiSummarize` function in `kagi-api.ts` wrapping the Kagi Universal Summarizer API (`/api/v0/summarize`)
- Register the new tool alongside `web_search` in the extension entry point
- Provide custom TUI rendering for summarize calls and results (compact call display, expandable result)

## Capabilities

### New Capabilities
- `universal-summarizer`: Tool that summarizes content from a URL via Kagi's Universal Summarizer API, with support for summary types and target language selection

### Modified Capabilities

_(none — the existing `web-search` capability is unchanged)_

## Impact

- **Code**: New `summarize.ts` tool module, additions to `kagi-api.ts` for the summarizer endpoint, update to `index.ts` to register the new tool
- **APIs**: Calls the Kagi Universal Summarizer API at `https://kagi.com/api/v0/summarize` using the same `KAGI_API_KEY`
- **Dependencies**: No new dependencies — uses the same `fetch`, Typebox, and pi-tui/pi-coding-agent imports as the existing web search tool
