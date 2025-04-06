import fs from 'fs/promises';
import path from 'path';

/**
 * Recursively scans a directory for markdown files
 * @param docsPath Root directory to scan
 * @returns Array of file paths to markdown files
 */
export async function getMarkdownFiles(docsPath: string): Promise<string[]> {
  const allFiles: string[] = [];

  async function scanDirectory(dirPath: string) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(entryPath);
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdc'))) {
        allFiles.push(entryPath);
      }
    }
  }

  await scanDirectory(docsPath);
  return allFiles;
}

/**
 * Reads the content of a file
 * @param filePath Path to the file
 * @returns File content as string
 */
export async function readFileContent(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw new Error(`Could not read file: ${filePath}`);
  }
} 