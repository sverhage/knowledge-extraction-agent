import type { VercelRequest, VercelResponse } from "@vercel/node";
import { config } from "../lib/config";
import { logger } from "../lib/logger";
import { FormatRequestSchema, ClaudeResultSchema } from "../lib/schema";
import { renderNotionMarkdown } from "../lib/render";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const parsed = FormatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid request body" });
  }

  const { pageId, trigger, secret } = parsed.data;

  if (secret !== config.webhookSecret) {
    logger.warn("Unauthorized format request", { pageId, trigger });
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    logger.info("Format article request received", { pageId, trigger });

    const placeholderClaudeResponse = {
      metadata: {
        title: null,
        author: null,
        source: null,
        publication_date: null,
        original_url: null
      },
      properties: {
        summary: "Scaffold response. Claude and Notion integration will be wired in Release 0.3.",
        category_name: null,
        category_confidence: 0,
        subcategories: [],
        importance: "Low",
        evergreen_score: 1,
        knowledge_score: 1
      },
      summary_by_claude_markdown: "## Summary by Claude\n\n### Executive Summary\n\nScaffold response. Claude integration will be wired in Release 0.3.",
      cleaned_article_markdown: "## Cleaned Article\n\n### Article Metadata\n\n### Cleaned Body\n\nScaffold response.",
      extraction_notes: {
        content_quality: "Low",
        content_type: "unknown",
        classification_reasoning: "Placeholder response for deployment verification.",
        missing_or_uncertain_fields: [],
        warnings: []
      }
    };

    const result = ClaudeResultSchema.parse(placeholderClaudeResponse);
    const markdown = renderNotionMarkdown(result);

    return res.status(200).json({
      ok: true,
      pageId,
      trigger,
      service: config.serviceName,
      release: config.release,
      status: "scaffold_ok",
      markdownPreview: markdown.slice(0, 500)
    });
  } catch (error) {
    logger.error("Format article request failed", {
      pageId,
      trigger,
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return res.status(500).json({
      ok: false,
      pageId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
