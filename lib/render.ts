import type { ClaudeResult } from "./schema";

export function renderNotionMarkdown(result: ClaudeResult): string {
  return [
    result.summary_by_claude_markdown.trim(),
    "\n---\n",
    result.cleaned_article_markdown.trim()
  ].join("\n");
}
