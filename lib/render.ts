import type { ClaudeResult } from "./schema";

export function renderNotionMarkdown(result: ClaudeResult): string {
  return [
    result.summary_by_claude_markdown.trim(),
    "\n---\n",
    result.cleaned_article_markdown.trim()
  ].join("\n");
}

export function truncateForNotionText(value: string, max = 1900): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
