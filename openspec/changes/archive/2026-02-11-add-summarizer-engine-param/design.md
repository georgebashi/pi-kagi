## Context

The `summarize` tool already accepts `url`, `summary_type`, and `target_language`. The Kagi API also accepts an `engine` parameter that selects the summarization model. Two consumer engines are relevant: cecil (default, general-purpose) and agnes (formal, technical, analytical). The change threads a new optional parameter through all layers.

## Goals / Non-Goals

**Goals:**
- Let the LLM choose between cecil and agnes based on the content being summarized
- Provide clear descriptions so the LLM makes good engine choices
- Default to cecil (the API default) when engine is omitted

**Non-Goals:**
- Exposing daphne (informal/creative) or muriel (enterprise, $1/summary) — out of scope
- Making engine selection automatic based on content type

## Decisions

### 1. Parameter values

**Decision:** Enum of `"cecil"` | `"agnes"`, optional, defaulting to cecil.

**Rationale:** Matches the Kagi API values exactly. Only the two consumer engines the user requested. Omitting the parameter uses cecil, which is also the Kagi API default — no behavior change for existing callers.

### 2. LLM guidance

**Decision:** Add engine descriptions to the tool description:
- cecil (default): Fast, general-purpose — good for most content
- agnes: Formal, technical, analytical — better for technical docs, papers, specs

**Rationale:** Short enough to not bloat the tool description, descriptive enough for the LLM to make a reasonable choice.

### 3. Threading through kagi-api.ts

**Decision:** Add `engine` to the existing options parameter of `kagiSummarize`.

**Rationale:** Minimal change — just one more optional field in the options object and one more line in the request body construction.

## Risks / Trade-offs

- **[Engine availability]** → If Kagi deprecates or renames an engine, the tool will get API errors. The existing error handling will surface these clearly.
