#!/usr/bin/env bun

import { startServer } from './server';

/**
 * Main entry point for the code rules MCP server
 */
async function main() {
  try {
    await startServer();
  } catch (error) {
    console.error("Fatal error running server:", error);
    process.exit(1);
  }
}

// Start the server
main();