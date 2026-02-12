# pi-kagi

A [pi](https://github.com/badlogic/pi) coding agent extension that adds `web_search` and `summarize` tools backed by [Kagi's API](https://help.kagi.com/kagi/api/overview.html).

## Setup

1. Set your Kagi API key:

   ```bash
   export KAGI_API_KEY="your-kagi-api-key"
   ```

   Get one at [kagi.com/settings?p=api](https://kagi.com/settings?p=api).

2. Install the extension (pick one):

   **Global (all projects):**
   ```bash
   # Clone or symlink into the global extensions directory
   ln -s /path/to/pi-kagi ~/.pi/agent/extensions/pi-kagi
   ```

   **Project-local:**
   ```bash
   # Clone or symlink into the project extensions directory
   ln -s /path/to/pi-kagi .pi/extensions/pi-kagi
   ```

   **Quick test:**
   ```bash
   pi -e /path/to/pi-kagi/index.ts
   ```

## Tools

### `web_search`

Search the web using one or more queries. Returns ranked results with titles, URLs, and snippets.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `queries` | `string[]` | One or more search queries |

**Example:**

```
web_search({ queries: ["kagi search API documentation"] })
```

Results are formatted as a numbered list with title, URL, and snippet. Output is automatically truncated to stay within context limits.

### `summarize`

Summarize content from a URL. Works with web pages, PDFs, videos, podcasts, and other document types.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `url` | `string` | URL to summarize |
| `summary_type` | `"summary" \| "takeaway"` | Paragraph prose (default) or bullet points |
| `engine` | `"cecil" \| "agnes"` | `cecil` (default, fast general-purpose) or `agnes` (formal, technical, analytical) |
| `target_language` | `string` | Language code for output (e.g., `"EN"`, `"DE"`, `"JA"`) |

**Example:**

```
summarize({ url: "https://example.com/long-article", summary_type: "takeaway", engine: "agnes" })
```

## License

MIT
