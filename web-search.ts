import { Type } from "@sinclair/typebox";
import { Text } from "@mariozechner/pi-tui";
import {
	DEFAULT_MAX_BYTES,
	DEFAULT_MAX_LINES,
	formatSize,
	truncateHead,
	type TruncationResult,
} from "@mariozechner/pi-coding-agent";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { kagiSearch, type KagiSearchResult } from "./kagi-api.ts";

const TOOL_DESCRIPTION = `Search the web for real-time information using one or more queries. Returns ranked results with titles, URLs, and snippets.

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
- [Page Title](https://example.com)`;

const WebSearchParams = Type.Object({
	queries: Type.Array(Type.String({ description: "A search query" }), {
		description: "One or more concise, keyword-focused search queries",
	}),
});

interface WebSearchDetails {
	queries: string[];
	resultCount: number;
	results?: KagiSearchResult[];
	truncation?: TruncationResult;
	fullOutputPath?: string;
	error?: string;
}

function formatResults(results: KagiSearchResult[]): string {
	return results
		.map(
			(r, i) =>
				`${i + 1}. ${r.title}\n   ${r.url}${r.snippet ? `\n   ${r.snippet}` : ""}`,
		)
		.join("\n\n");
}

export function createWebSearchTool() {
	return {
		name: "web_search",
		label: "Web Search",
		description: TOOL_DESCRIPTION,
		parameters: WebSearchParams,

		async execute(
			_toolCallId: string,
			params: { queries: string[] },
			_signal: AbortSignal | undefined,
			_onUpdate: any,
			_ctx: any,
		) {
			const apiKey = process.env.KAGI_API_KEY;
			if (!apiKey) {
				return {
					content: [
						{
							type: "text" as const,
							text: "KAGI_API_KEY environment variable is not set. Set it to your Kagi API key to use web search.",
						},
					],
					details: { queries: params.queries, resultCount: 0, error: "missing_api_key" } as WebSearchDetails,
					isError: true,
				};
			}

			const response = await kagiSearch(params.queries, apiKey);

			if (!response.ok) {
				return {
					content: [{ type: "text" as const, text: response.error }],
					details: { queries: params.queries, resultCount: 0, error: response.error } as WebSearchDetails,
					isError: true,
				};
			}

			if (response.results.length === 0) {
				return {
					content: [{ type: "text" as const, text: "No results found." }],
					details: { queries: params.queries, resultCount: 0 } as WebSearchDetails,
				};
			}

			const output = formatResults(response.results);

			const truncation = truncateHead(output, {
				maxLines: DEFAULT_MAX_LINES,
				maxBytes: DEFAULT_MAX_BYTES,
			});

			const details: WebSearchDetails = {
				queries: params.queries,
				resultCount: response.results.length,
				results: response.results,
			};

			let resultText = truncation.content;

			if (truncation.truncated) {
				const tempDir = mkdtempSync(join(tmpdir(), "pi-web-search-"));
				const tempFile = join(tempDir, "output.txt");
				writeFileSync(tempFile, output);

				details.truncation = truncation;
				details.fullOutputPath = tempFile;

				resultText += `\n\n[Output truncated: showing ${truncation.outputLines} of ${truncation.totalLines} lines`;
				resultText += ` (${formatSize(truncation.outputBytes)} of ${formatSize(truncation.totalBytes)}).`;
				resultText += ` Full output saved to: ${tempFile}]`;
			}

			return {
				content: [{ type: "text" as const, text: resultText }],
				details,
			};
		},

		renderCall(args: { queries: string[] }, theme: any) {
			let text = theme.fg("toolTitle", theme.bold("web_search "));
			text += theme.fg("accent", args.queries.map((q: string) => `"${q}"`).join(", "));
			return new Text(text, 0, 0);
		},

		renderResult(result: any, { expanded, isPartial }: { expanded: boolean; isPartial: boolean }, theme: any) {
			const details = result.details as WebSearchDetails | undefined;

			if (isPartial) {
				return new Text(theme.fg("warning", "Searching..."), 0, 0);
			}

			if (details?.error) {
				return new Text(theme.fg("error", `Error: ${details.error}`), 0, 0);
			}

			if (!details || details.resultCount === 0) {
				return new Text(theme.fg("dim", "No results found"), 0, 0);
			}

			let text = theme.fg("success", `${details.resultCount} results`);

			if (details.truncation?.truncated) {
				text += theme.fg("warning", " (truncated)");
			}

			if (expanded && details.results) {
				const show = details.results.slice(0, 10);
				for (const r of show) {
					text += `\n  ${theme.fg("accent", r.title)}`;
					text += `\n  ${theme.fg("dim", r.url)}`;
					if (r.snippet) {
						text += `\n  ${theme.fg("muted", r.snippet)}`;
					}
				}
				if (details.results.length > 10) {
					text += `\n  ${theme.fg("muted", `... and ${details.results.length - 10} more`)}`;
				}
				if (details.fullOutputPath) {
					text += `\n  ${theme.fg("dim", `Full output: ${details.fullOutputPath}`)}`;
				}
			}

			return new Text(text, 0, 0);
		},
	};
}
