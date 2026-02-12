# pi-kagi

A [pi](https://github.com/badlogic/pi) coding agent extension that adds a `web_search` tool backed by [Kagi's Search API](https://help.kagi.com/kagi/api/search.html).

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

**Example usage by the LLM:**

```
web_search({ queries: ["kagi search API documentation"] })
```

Results are formatted as a numbered list:

```
1. Kagi Search API - Developer Documentation
   https://help.kagi.com/kagi/api/search.html
   Complete reference for the Kagi Search API including authentication...

2. ...
```

Output is automatically truncated to stay within context limits. If truncated, the full output is saved to a temp file.
