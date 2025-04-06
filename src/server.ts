import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { CODE_RULES_TOOL, createRequestHandler } from './tool';

/**
 * Create and configure the MCP server
 * @returns The configured server instance
 */
export function createServer() {
  const server = new Server(
    {
      name: "code-rules-mcp",
      version: "0.0.1",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register the code rules tool
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [CODE_RULES_TOOL],
  }));

  // Set up the tool request handler
  const handleRequest = createRequestHandler();
  server.setRequestHandler(CallToolRequestSchema, handleRequest);

  return server;
}

/**
 * Start the MCP server with stdin/stdout transport
 */
export async function startServer() {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("Code Rules MCP Server running on stdio");

  return server;
} 