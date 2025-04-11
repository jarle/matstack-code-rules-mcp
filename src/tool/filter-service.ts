import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { DocMetadata } from './schema';

/**
 * Service for AI-based filtering and relevance determination
 */
export class FilterService {
  private model = openai('gpt-4o-mini');
  private taskCache = new Map<string, string>();

  /**
   * AI analyzes the task and file metadata to determine if files are relevant
   * Instead of ranking, this implementation uses a binary approach to keep files
   * unless they are clearly irrelevant to the task
   * 
   * @param files Array of document metadata
   * @param task Task description
   * @returns Filtered array of relevant document metadata
   */
  public async filterRelevantFiles(files: DocMetadata[], task: string): Promise<DocMetadata[]> {
    console.error(`Filtering ${files.length} files for task: ${task}`);

    // For empty arrays, return immediately
    if (files.length === 0) return [];

    // For single file or just a few files, keep all of them
    if (files.length <= 3) {
      return files.map(file => ({
        ...file,
        relevanceScore: 1.0 // Mark as fully relevant
      }));
    }

    // Prepare file metadata for the AI prompt - use a more compact format
    const fileInfos = files.map((file, index) => {
      const tags = file.tags ? `tags: [${file.tags.join(', ')}]` : '';
      return `File ${index + 1}: ${file.filename} ${file.title ? `- ${file.title}` : ''} ${tags}`;
    }).join('\n');

    const prompt = `Task: ${task}
Files:
${fileInfos}

KEEP files that contain relevant information, including:
- Files that directly relate to the task
- Files with general rules or guidelines that apply broadly
- Files that contain architectural principles or coding standards
- Files that might provide context for the task

Exclude files that are not relevant to the task.

Return a JSON array with objects containing:
1. fileIndex (1-based index)
2. include (boolean)
3. reasoning (brief)`;

    try {
      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0,
        maxTokens: 1024, // Limit token usage for faster response
      });

      // Extract the JSON from the response
      const jsonMatch = text.match(/\[.*\]/s);
      if (!jsonMatch) {
        console.error('Could not extract JSON from AI response');
        return files; // Keep all files if parsing fails
      }

      const jsonText = jsonMatch[0];
      const filterData = JSON.parse(jsonText);

      // Filter the files based on the AI decision
      const filteredFiles = files.filter((file, index) => {
        const fileData = filterData.find((item: any) => item.fileIndex === index + 1);
        // Keep the file if the AI says to include it or if we can't determine (null/undefined)
        console.error(`File ${file.filename} is ${fileData?.include ? 'included' : 'excluded'}`);
        return !fileData || fileData.include !== false;
      }).map(file => ({
        ...file,
        relevanceScore: 1.0 // All included files are treated as equally relevant
      }));

      console.error(`Filtered ${filteredFiles.length} files`);

      return filteredFiles;
    } catch (error) {
      console.error('Error filtering files:', error);
      // Fallback to keeping all files if the AI call fails
      return files;
    }
  }

  /**
   * AI analyzes the file content to exclude irrelevant sections
   * This implementation focuses on keeping most content and only 
   * removing clearly irrelevant parts
   * 
   * @param content Full content of the file
   * @param task Task description
   * @returns Filtered content with irrelevant sections removed
   */
  public async filterRelevantContent(content: string, task: string): Promise<string> {
    if (!content || content.trim() === '') {
      return "";
    }

    // Create a cache key based on content and task
    const cacheKey = this.createCacheKey(content, task);

    // Check if we have a cached result
    if (this.taskCache.has(cacheKey)) {
      console.error(`Using cached content filtering result`);
      return this.taskCache.get(cacheKey) as string;
    }

    console.error(`Processing content (${content.length} chars)`);

    // For extremely short content, just return it as is
    if (content.length < 500) {
      return content;
    }

    // Use a shorter, more concise prompt for faster processing
    const prompt = `Task: ${task}

Doc content:
\`\`\`
${content}
\`\`\`

Process this doc by:
1. KEEP most content by default
2. KEEP ALL code examples, structures, config samples
3. KEEP all principles, guidelines, standards
4. KEEP architectural information
5. ONLY remove CLEARLY IRRELEVANT sections
6. Maintain original formatting and structure

If uncertain about relevance, keep it.
Do not comment on why something was included or excluded.

Your format should be raw markdown as-is without any additional text or formatting.
Do not wrap the content in triple backtick fenced code blocks.
If nothing is relevant, return an empty string.`;

    try {
      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0,
        // Don't set maxTokens for content filtering as we need the full response
      });

      // Cache the result
      this.taskCache.set(cacheKey, text);

      return text;
    } catch (error) {
      console.error('Error filtering content:', error);
      // Return the original content if filtering fails
      return content;
    }
  }

  /**
   * Creates a cache key for the content filtering
   * Uses a hash of content and task to avoid excessive memory usage
   */
  private createCacheKey(content: string, task: string): string {
    // Simple hashing function
    const simpleHash = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    };

    const contentHash = simpleHash(content);
    const taskHash = simpleHash(task);
    return `${contentHash}:${taskHash}`;
  }
} 