## Why

The Kagi Universal Summarizer API supports multiple summarization engines with different characteristics. Currently the `summarize` tool uses the API default (cecil) with no way to choose. Exposing the engine parameter lets the LLM pick the right engine for the task — cecil for general/quick summaries, agnes for formal technical analysis.

## What Changes

- Add an optional `engine` parameter to the `summarize` tool accepting `"cecil"` or `"agnes"`
- Pass the `engine` field through to the Kagi API request body
- Update the tool description so the LLM knows when to use each engine
- Update TUI rendering to show the selected engine when non-default

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities
- `universal-summarizer`: Adding an `engine` parameter to select between cecil (default, general-purpose) and agnes (formal, technical, analytical)

## Impact

- **Code**: Changes to `summarize.ts` (parameter schema, tool description, execute, TUI rendering) and `kagi-api.ts` (options type, request body)
- **APIs**: Same Kagi endpoint, now also sending the `engine` field in the request body
- **Dependencies**: None — no new imports or packages
