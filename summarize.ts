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
import { kagiSummarize } from "./kagi-api.ts";

const TOOL_DESCRIPTION = `Summarize content from a URL. Works with web pages, PDFs, videos, podcasts, and other document types. Returns a concise summary to avoid consuming excessive context on long documents.

When to use:
- Digesting long documentation pages, release notes, or changelogs
- Getting key points from a video or podcast transcript
- Summarizing a PDF or technical paper
- Understanding a lengthy discussion thread or blog post

Parameters:
- url (required): The URL to summarize
- summary_type (optional): "summary" for paragraph prose (default), or "takeaway" for a bulleted list of key points
- engine (optional): Summarization engine to use:
  - "cecil" (default): Fast, general-purpose — good for most content
  - "agnes": Formal, technical, analytical — better for technical docs, papers, and specs
- target_language (optional): Language code for the output (e.g., "EN", "DE", "JA"). Defaults to the document's language.`;

const SummarizeParams = Type.Object({
	url: Type.String({ description: "A URL to a document to summarize" }),
	summary_type: Type.Optional(
		Type.Union([Type.Literal("summary"), Type.Literal("takeaway")], {
			description: 'Type of summary: "summary" for paragraph prose (default), "takeaway" for bullet points',
		}),
	),
	engine: Type.Optional(
		Type.Union([Type.Literal("cecil"), Type.Literal("agnes")], {
			description: 'Summarization engine: "cecil" (default, fast general-purpose) or "agnes" (formal, technical, analytical)',
		}),
	),
	target_language: Type.Optional(
		Type.String({
			description: 'Language code for the output (e.g., "EN", "DE", "JA"). Defaults to the document\'s language.',
		}),
	),
});

interface SummarizeDetails {
	url: string;
	summaryType: string;
	engine: string;
	tokens: number;
	truncation?: TruncationResult;
	fullOutputPath?: string;
	error?: string;
}

export function createSummarizeTool() {
	return {
		name: "summarize",
		label: "Summarize",
		description: TOOL_DESCRIPTION,
		parameters: SummarizeParams,

		async execute(
			_toolCallId: string,
			params: { url: string; summary_type?: "summary" | "takeaway"; engine?: "cecil" | "agnes"; target_language?: string },
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
							text: "KAGI_API_KEY environment variable is not set. Set it to your Kagi API key to use summarize.",
						},
					],
					details: { url: params.url, summaryType: params.summary_type ?? "summary", engine: params.engine ?? "cecil", tokens: 0, error: "missing_api_key" } as SummarizeDetails,
					isError: true,
				};
			}

			const summaryType = params.summary_type ?? "summary";
			const engine = params.engine ?? "cecil";

			const response = await kagiSummarize(params.url, apiKey, {
				summaryType,
				engine,
				targetLanguage: params.target_language,
			});

			if (!response.ok) {
				return {
					content: [{ type: "text" as const, text: response.error }],
					details: { url: params.url, summaryType, engine, tokens: 0, error: response.error } as SummarizeDetails,
					isError: true,
				};
			}

			const truncation = truncateHead(response.output, {
				maxLines: DEFAULT_MAX_LINES,
				maxBytes: DEFAULT_MAX_BYTES,
			});

			const details: SummarizeDetails = {
				url: params.url,
				summaryType,
				engine,
				tokens: response.tokens,
			};

			let resultText = truncation.content;

			if (truncation.truncated) {
				const tempDir = mkdtempSync(join(tmpdir(), "pi-summarize-"));
				const tempFile = join(tempDir, "output.txt");
				writeFileSync(tempFile, response.output);

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

		renderCall(args: { url: string; summary_type?: string; engine?: string }, theme: any) {
			let text = theme.fg("toolTitle", theme.bold("summarize "));
			text += theme.fg("accent", `"${args.url}"`);
			const extras: string[] = [];
			if (args.engine && args.engine !== "cecil") {
				extras.push(args.engine);
			}
			if (args.summary_type && args.summary_type !== "summary") {
				extras.push(args.summary_type);
			}
			if (extras.length > 0) {
				text += theme.fg("dim", ` (${extras.join(", ")})`);
			}
			return new Text(text, 0, 0);
		},

		renderResult(result: any, { expanded, isPartial }: { expanded: boolean; isPartial: boolean }, theme: any) {
			const details = result.details as SummarizeDetails | undefined;

			if (isPartial) {
				return new Text(theme.fg("warning", "Summarizing..."), 0, 0);
			}

			if (details?.error) {
				return new Text(theme.fg("error", `Error: ${details.error}`), 0, 0);
			}

			if (!details) {
				return new Text(theme.fg("dim", "No summary available"), 0, 0);
			}

			let text = theme.fg("success", `${details.engine} · ${details.summaryType} · ${details.tokens} tokens`);

			if (details.truncation?.truncated) {
				text += theme.fg("warning", " (truncated)");
			}

			if (expanded) {
				const content = result.content?.[0]?.text ?? "";
				if (content) {
					const lines = content.split("\n").slice(0, 20);
					for (const line of lines) {
						text += `\n  ${theme.fg("muted", line)}`;
					}
					const totalLines = content.split("\n").length;
					if (totalLines > 20) {
						text += `\n  ${theme.fg("dim", `... and ${totalLines - 20} more lines`)}`;
					}
				}
				if (details.fullOutputPath) {
					text += `\n  ${theme.fg("dim", `Full output: ${details.fullOutputPath}`)}`;
				}
			}

			return new Text(text, 0, 0);
		},
	};
}
