import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createWebSearchTool } from "./web-search.ts";
import { createSummarizeTool } from "./summarize.ts";

export default function (pi: ExtensionAPI) {
	pi.registerTool(createWebSearchTool());
	pi.registerTool(createSummarizeTool());
}
