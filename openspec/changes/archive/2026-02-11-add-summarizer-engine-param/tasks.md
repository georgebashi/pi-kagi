## 1. API Client

- [x] 1.1 Add `engine?: "cecil" | "agnes"` to the `kagiSummarize` options type in `kagi-api.ts`
- [x] 1.2 Pass `engine` in the request body when provided

## 2. Tool Definition

- [x] 2.1 Add `engine` parameter to `SummarizeParams` Typebox schema (optional enum: "cecil" | "agnes")
- [x] 2.2 Update `TOOL_DESCRIPTION` to describe the engine parameter and when to use each engine
- [x] 2.3 Add `engine` to the `SummarizeDetails` interface

## 3. Tool Execution

- [x] 3.1 Pass `engine` from params through to `kagiSummarize` options in the `execute` function

## 4. TUI Rendering

- [x] 4.1 Update `renderCall` to show engine name when non-default (not "cecil")
- [x] 4.2 Update `renderResult` to include engine in the collapsed status line
