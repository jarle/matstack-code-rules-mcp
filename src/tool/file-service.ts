import path from 'path';
import { getMarkdownFiles, readFileContent } from './file-system';
import type { DocMetadata } from './schema';

/**
 * Service for handling file discovery and metadata extraction
 */
export class FileService {
  /**
   * Get all markdown files in a directory
   * @param docsPath Path to the documentation directory
   * @returns Array of file paths to markdown files
   */
  public async discoverMarkdownFiles(docsPath: string): Promise<string[]> {
    const files = await getMarkdownFiles(docsPath);
    console.error(`Found ${files.length} markdown files in ${docsPath}`);
    return files;
  }

  /**
   * Extract frontmatter and metadata from a markdown file
   * @param filePath Path to the markdown file
   * @returns Document metadata
   */
  public async extractMetadata(filePath: string): Promise<DocMetadata> {
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
   * Get the content of a markdown file with frontmatter removed
   * @param filePath Path to the markdown file
   * @returns File content with frontmatter removed
   */
  public async getFileContent(filePath: string): Promise<string> {
    try {
      const content = await readFileContent(filePath);

      // Remove frontmatter
      return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
    } catch (error) {
      console.error(`Error reading file content ${filePath}:`, error);
      return `Error: Could not read ${filePath}`;
    }
  }
} 