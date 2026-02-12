import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createWebSearchTool } from "./web-search.ts";

export default function (pi: ExtensionAPI) {
	pi.registerTool(createWebSearchTool());
}
