/**
 * Removes Markdown formatting from text
 * Handles: headers, bold, italic, strikethrough, underline, code, links, lists, HTML tags
 */
export function stripMarkdown(text: string): string {
  if (!text) return ""

  return text
    // Remove headers (# ## ### etc)
    .replace(/^#+\s+/gm, "")
    // Remove bold with ** or __
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    // Remove italic with * or _
    .replace(/\*([^*]+?)\*/g, "$1")
    .replace(/_([^_]+?)_/g, "$1")
    // Remove strikethrough ~~
    .replace(/~~(.+?)~~/g, "$1")
    // Remove underline __u ...__ format
    .replace(/__u\s+([^_]+?)__/g, "$1")
    // Remove inline code with backticks
    .replace(/`([^`]+?)`/g, "$1")
    // Convert markdown links [text](url) to just text
    .replace(/\[([^\]]+?)\]\([^)]*?\)/g, "$1")
    // Convert markdown images ![alt](url) to just alt text
    .replace(/!\[([^\]]*?)\]\([^)]*?\)/g, "$1")
    // Remove list markers (-, *, +) at start of lines
    .replace(/^\s*[-*+]\s+/gm, "")
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Clean up extra whitespace
    .trim()
}
