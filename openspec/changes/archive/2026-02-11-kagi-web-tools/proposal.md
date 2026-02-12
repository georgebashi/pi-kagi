## Why

Coding agents like Claude Code and OpenCode ship with built-in web search and fetch tools that let the LLM look things up during a session — checking docs, searching for error messages, fetching API references. Pi doesn't have these built-in, but its extension system supports custom tools. Kagi provides a high-quality, ad-free search API — ideal for getting relevant results without ad noise. This change creates a pi extension that adds a `web_search` tool backed by Kagi's Search API.

## What Changes

- Add a new pi extension package (`pi-kagi`) that registers a custom tool:
  - **`web_search`** — Performs web search via Kagi's Search API, returning ranked results with titles, URLs, and snippets. Supports multiple queries in a single call.
- The extension reads the Kagi API key from an environment variable (`KAGI_API_KEY`).
- The tool includes proper output truncation and custom TUI rendering (call + result).
- The extension is structured as a directory with `package.json` for dependency management and can be installed globally (`~/.pi/agent/extensions/`) or per-project (`.pi/extensions/`).

## Capabilities

### New Capabilities

- `web-search`: Search the web via Kagi's Search API — accepts one or more queries, returns ranked results (title, URL, snippet), with truncation for large result sets.

### Modified Capabilities

_(none — this is a greenfield extension with no existing specs)_

## Impact

- **Dependencies**: Requires a Kagi API key (`KAGI_API_KEY` environment variable). Uses `node:https` or `fetch` for HTTP calls — no external npm dependencies required beyond pi's own packages (`@mariozechner/pi-coding-agent`, `@sinclair/typebox`, `@mariozechner/pi-tui`).
- **Extension registration**: One new tool (`web_search`) added to the LLM's tool palette. This increases the system prompt size slightly (tool description).
- **No breaking changes**: This is a purely additive extension.
