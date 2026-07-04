import { z } from "zod";

export const FormatRequestSchema = z.object({
  pageId: z.string().min(8),
  trigger: z.enum(["manual", "auto"]).default("manual"),
  secret: z.string().min(8)
});

export const ClaudeResultSchema = z.object({
  metadata: z.object({
    title: z.string().nullable(),
    author: z.string().nullable(),
    source: z.string().nullable(),
    publication_date: z.string().nullable(),
    original_url: z.string().nullable()
  }),
  properties: z.object({
    summary: z.string(),
    category_name: z.string().nullable(),
    category_confidence: z.number().min(0).max(1),
    subcategories: z.array(z.string()),
    importance: z.enum(["High", "Medium", "Low"]),
    evergreen_score: z.number().int().min(1).max(10),
    knowledge_score: z.number().int().min(1).max(10)
  }),
  summary_by_claude_markdown: z.string(),
  cleaned_article_markdown: z.string(),
  extraction_notes: z.object({
    content_quality: z.enum(["High", "Medium", "Low"]),
    content_type: z.string(),
    classification_reasoning: z.string(),
    missing_or_uncertain_fields: z.array(z.string()),
    warnings: z.array(z.string())
  })
});

export type ClaudeResult = z.infer<typeof ClaudeResultSchema>;
