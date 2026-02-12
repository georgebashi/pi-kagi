const KAGI_SEARCH_URL = "https://kagi.com/api/v0/search";
const KAGI_SUMMARIZE_URL = "https://kagi.com/api/v0/summarize";

export interface KagiSearchResult {
	title: string;
	url: string;
	snippet: string;
}

export interface KagiSearchSuccess {
	ok: true;
	results: KagiSearchResult[];
}

export interface KagiSearchError {
	ok: false;
	error: string;
}

export type KagiSearchResponse = KagiSearchSuccess | KagiSearchError;

interface KagiApiResult {
	t: number; // result type: 0 = search result
	title?: string;
	url?: string;
	snippet?: string;
}

interface KagiApiResponse {
	meta?: { id?: string; node?: string; ms?: number };
	data?: KagiApiResult[];
	error?: Array<{ code: number; msg: string }>;
}

export async function kagiSearch(queries: string[], apiKey: string): Promise<KagiSearchResponse> {
	const allResults: KagiSearchResult[] = [];

	for (const query of queries) {
		const url = new URL(KAGI_SEARCH_URL);
		url.searchParams.set("q", query);

		let response: Response;
		try {
			response = await fetch(url.toString(), {
				headers: {
					Authorization: `Bot ${apiKey}`,
				},
			});
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			return { ok: false, error: `Network error while searching for "${query}": ${message}` };
		}

		if (!response.ok) {
			let errorMessage = `Kagi API returned HTTP ${response.status}`;
			try {
				const body = (await response.json()) as KagiApiResponse;
				if (body.error?.length) {
					errorMessage += `: ${body.error.map((e) => e.msg).join(", ")}`;
				}
			} catch {
				// Could not parse error body — use status alone
			}
			return { ok: false, error: errorMessage };
		}

		let body: KagiApiResponse;
		try {
			body = (await response.json()) as KagiApiResponse;
		} catch {
			return { ok: false, error: `Failed to parse Kagi API response for "${query}"` };
		}

		if (body.error?.length) {
			return { ok: false, error: `Kagi API error: ${body.error.map((e) => e.msg).join(", ")}` };
		}

		if (body.data) {
			for (const item of body.data) {
				// type 0 = search results (skip related searches, etc.)
				if (item.t === 0 && item.url && item.title) {
					allResults.push({
						title: item.title,
						url: item.url,
						snippet: item.snippet ?? "",
					});
				}
			}
		}
	}

	return { ok: true, results: allResults };
}

// --- Universal Summarizer ---

export interface KagiSummarizeSuccess {
	ok: true;
	output: string;
	tokens: number;
}

export interface KagiSummarizeError {
	ok: false;
	error: string;
}

export type KagiSummarizeResponse = KagiSummarizeSuccess | KagiSummarizeError;

interface KagiSummarizeApiResponse {
	meta?: { id?: string; node?: string; ms?: number };
	data?: { output?: string; tokens?: number };
	error?: Array<{ code: number; msg: string }>;
}

export async function kagiSummarize(
	url: string,
	apiKey: string,
	options?: { summaryType?: "summary" | "takeaway"; engine?: "cecil" | "agnes"; targetLanguage?: string },
): Promise<KagiSummarizeResponse> {
	const body: Record<string, string> = { url };
	if (options?.summaryType) {
		body.summary_type = options.summaryType;
	}
	if (options?.engine) {
		body.engine = options.engine;
	}
	if (options?.targetLanguage) {
		body.target_language = options.targetLanguage;
	}

	let response: Response;
	try {
		response = await fetch(KAGI_SUMMARIZE_URL, {
			method: "POST",
			headers: {
				Authorization: `Bot ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, error: `Network error while summarizing "${url}": ${message}` };
	}

	if (!response.ok) {
		let errorMessage = `Kagi API returned HTTP ${response.status}`;
		try {
			const parsed = (await response.json()) as KagiSummarizeApiResponse;
			if (parsed.error?.length) {
				errorMessage += `: ${parsed.error.map((e) => e.msg).join(", ")}`;
			}
		} catch {
			// Could not parse error body — use status alone
		}
		return { ok: false, error: errorMessage };
	}

	let parsed: KagiSummarizeApiResponse;
	try {
		parsed = (await response.json()) as KagiSummarizeApiResponse;
	} catch {
		return { ok: false, error: `Failed to parse Kagi API response for "${url}"` };
	}

	if (parsed.error?.length) {
		return { ok: false, error: `Kagi API error: ${parsed.error.map((e) => e.msg).join(", ")}` };
	}

	if (!parsed.data?.output) {
		return { ok: false, error: `Kagi API returned no summary for "${url}"` };
	}

	return { ok: true, output: parsed.data.output, tokens: parsed.data.tokens ?? 0 };
}
