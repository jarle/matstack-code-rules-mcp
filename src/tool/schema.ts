import { type Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';

// Schema for the input parameters
export const CodeRulesInputSchema = z.object({
  task: z.string().min(1, 'Task description is required'),
  docsPath: z.string().min(1, 'Documentation path is required'),
});

export type CodeRulesInput = z.infer<typeof CodeRulesInputSchema>;

// Document metadata interface
export interface DocMetadata {
  filename: string;
  path: string;
  title?: string;
  tags?: string[];
  relevanceScore?: number;
}

// Relevant content from a specific file
export interface RelevantContent {
  file: string;
  content: string;
}

// Tool definition
export const CODE_RULES_TOOL: Tool = {
  name: "coderules",
  description: `A tool for extracting relevant coding rules and guidelines from a documentation repository.
This tool analyzes a collection of markdown files and returns contextually relevant information based on a given task.

When to use this tool:
- When implementing new features that need to follow project guidelines
- When modifying existing code and need to understand the project's conventions
- When reviewing code to ensure compliance with established standards
- When onboarding to a new project and need to understand its coding standards

Parameters explained:
- task: Description of what you're trying to do (implement feature, fix bug, etc.)
- docsPath: Path to the directory containing markdown documentation files`,
  inputSchema: {
    type: "object",
    properties: {
      task: {
        type: "string",
        description: "Description of the task you're working on"
      },
      docsPath: {
        type: "string",
        description: "Path to the documentation directory"
      }
    },
    required: ["task", "docsPath"]
  }
}; 