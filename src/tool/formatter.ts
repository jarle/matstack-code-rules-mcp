import type { RelevantContent } from './schema';

/**
 * Service for formatting the output from code rules processing
 */
export class FormatterService {
  /**
   * Format an array of relevant content into a markdown document
   * @param contents Array of relevant content items
   * @returns Formatted markdown document
   */
  public formatOutput(contents: RelevantContent[]): string {
    if (contents.length === 0) {
      return "No relevant documentation found for this task.";
    }

    return contents.map(item =>
      `## ${item.file}\n\n${item.content}\n\n`
    ).join('---\n\n');
  }

  /**
   * Create an error response for MCP
   * @param error Error object or message
   * @returns Formatted error response
   */
  public formatError(error: unknown): { content: Array<{ type: string; text: string }>; isError: boolean } {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          status: 'failed'
        }, null, 2)
      }],
      isError: true
    };
  }

  /**
   * Create a success response for MCP
   * @param content Formatted markdown content
   * @returns Formatted success response
   */
  public formatSuccess(content: string): { content: Array<{ type: string; text: string }> } {
    return {
      content: [{
        type: "text",
        text: content
      }]
    };
  }
} 