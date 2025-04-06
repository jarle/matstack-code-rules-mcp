import type { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { FileService } from './file-service';
import { FilterService } from './filter-service';
import { FormatterService } from './formatter';
import { CODE_RULES_TOOL, CodeRulesInputSchema, type RelevantContent } from './schema';

/**
 * Main service for processing code rules requests
 */
export class CodeRulesHandler {
  private fileService: FileService;
  private filterService: FilterService;
  private formatterService: FormatterService;

  constructor() {
    this.fileService = new FileService();
    this.filterService = new FilterService();
    this.formatterService = new FormatterService();
  }

  /**
   * Process a code rules request
   * @param input Raw input from the MCP request
   * @returns Response with relevant code rules content
   */
  public async processRequest(input: unknown): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      // Validate input
      const validatedInput = CodeRulesInputSchema.parse(input);
      const { task, docsPath } = validatedInput;

      console.error(`Processing task: "${task}" with docs path: ${docsPath}`);

      // Get all markdown files
      const markdownFiles = await this.fileService.discoverMarkdownFiles(docsPath);

      // Extract metadata from each file
      const filesWithMetadata = await Promise.all(
        markdownFiles.map(file => this.fileService.extractMetadata(file))
      );

      // Filter relevant files
      const relevantFiles = this.filterService.filterRelevantFiles(filesWithMetadata, task);
      console.error(`Selected ${relevantFiles.length} relevant files`);

      // Extract and filter content from relevant files
      const relevantContents: RelevantContent[] = await Promise.all(
        relevantFiles.map(async file => {
          const rawContent = await this.fileService.getFileContent(file.path);
          const filteredContent = this.filterService.filterRelevantContent(rawContent, task);
          return {
            file: file.filename,
            content: filteredContent
          };
        })
      );

      // Format the output as a markdown document
      const formattedOutput = this.formatterService.formatOutput(relevantContents);

      return this.formatterService.formatSuccess(formattedOutput);
    } catch (error) {
      return this.formatterService.formatError(error);
    }
  }
}

// Export the handler factory and tool definition
export { CODE_RULES_TOOL };

/**
 * Create a handler for code rules tool requests
 * @returns A function to handle code rules tool requests
 */
export function createRequestHandler() {
  const handler = new CodeRulesHandler();

  return async (request: typeof CallToolRequestSchema._type) => {
    if (request.params.name === "coderules") {
      return await handler.processRequest(request.params.arguments);
    }

    const formatter = new FormatterService();
    return formatter.formatError(`Unknown tool: ${request.params.name}`);
  };
} 