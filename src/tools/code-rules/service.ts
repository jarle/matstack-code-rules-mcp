import path from 'path';
import { getMarkdownFiles, readFileContent } from '../../tool/file-system';
import { CodeRulesInputSchema, type DocMetadata, type RelevantContent } from './schema';

export class CodeRulesService {
  /**
   * Extract frontmatter from a markdown file
   * @param filePath Path to the markdown file
   * @returns Document metadata
   */
  private async extractFrontmatter(filePath: string): Promise<DocMetadata> {
    try {
      const content = await readFileContent(filePath);
      const metadata: DocMetadata = {
        filename: path.basename(filePath),
        path: filePath,
      };

      // Simple frontmatter extraction
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];

        // Extract title
        const titleMatch = frontmatter.match(/title:\s*(.+)/);
        if (titleMatch) {
          metadata.title = titleMatch[1].trim();
        }

        // Extract tags
        const tagsMatch = frontmatter.match(/tags:\s*\[(.*)\]/);
        if (tagsMatch) {
          metadata.tags = tagsMatch[1].split(',').map(tag => tag.trim());
        }
      }

      return metadata;
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      return {
        filename: path.basename(filePath),
        path: filePath,
      };
    }
  }

  /**
   * AI would analyze the task and file metadata to determine relevance
   * This is a placeholder for the AI filtering logic
   * @param files Array of document metadata
   * @param task Task description
   * @returns Filtered array of relevant document metadata
   */
  private filterRelevantFiles(files: DocMetadata[], task: string): DocMetadata[] {
    console.error(`[AI Placeholder] Filtering ${files.length} files for task: ${task}`);

    // For the placeholder, we'll just return all files
    // In a real implementation, this would use AI to score and filter files
    return files.map(file => ({
      ...file,
      relevanceScore: 0.8, // Placeholder score
    }));
  }

  /**
   * AI would analyze the file content to extract relevant sections
   * This is a placeholder for the AI content filtering logic
   * @param filePath Path to the markdown file
   * @param task Task description
   * @returns Relevant content extracted from the file
   */
  private async filterRelevantContent(filePath: string, task: string): Promise<string> {
    console.error(`[AI Placeholder] Extracting relevant content from ${filePath} for task: ${task}`);

    try {
      const content = await readFileContent(filePath);

      // Remove frontmatter
      const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');

      // For the placeholder, we'll just return the full content
      // In a real implementation, this would use AI to filter sections
      return withoutFrontmatter;
    } catch (error) {
      console.error(`Error extracting content from ${filePath}:`, error);
      return `Error: Could not read ${filePath}`;
    }
  }

  /**
   * Format the relevant content into a single markdown document
   * @param contents Array of relevant content items
   * @returns Formatted markdown document
   */
  private formatOutput(contents: RelevantContent[]): string {
    return contents.map(item =>
      `## ${item.file}\n\n${item.content}\n\n`
    ).join('---\n\n');
  }

  /**
   * Process a code rules request
   * @param input Raw input from the MCP request
   * @returns Response with relevant code rules content
   */
  public async processCodeRules(input: unknown): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      // Validate input
      const validatedInput = CodeRulesInputSchema.parse(input);
      const { task, docsPath } = validatedInput;

      console.error(`Processing task: "${task}" with docs path: ${docsPath}`);

      // Get all markdown files
      const markdownFiles = await getMarkdownFiles(docsPath);
      console.error(`Found ${markdownFiles.length} markdown files`);

      // Extract metadata from each file
      const filesWithMetadata = await Promise.all(
        markdownFiles.map(file => this.extractFrontmatter(file))
      );

      // Filter relevant files
      const relevantFiles = this.filterRelevantFiles(filesWithMetadata, task);
      console.error(`Selected ${relevantFiles.length} relevant files`);

      // Extract and filter content from relevant files
      const relevantContents = await Promise.all(
        relevantFiles.map(async file => {
          const content = await this.filterRelevantContent(file.path, task);
          return {
            file: file.filename,
            content
          };
        })
      );

      // Format the output as a markdown document
      const contextOutput = this.formatOutput(relevantContents);

      return {
        content: [{
          type: "text",
          text: contextOutput
        }]
      };
    } catch (error) {
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
  }
} 