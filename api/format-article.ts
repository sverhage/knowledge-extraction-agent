import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FormatRequestSchema } from "../lib/schema";
import { renderNotionMarkdown } from "../lib/render";
import { runClaudeExtraction } from "../lib/anthropic";
import {
  fetchPageText,
  fetchTaxonomy,
  replacePageContent,
  setProcessingStatus,
  updatePageAfterSuccess
} from "../lib/notion";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const parsed = FormatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid request body" });
  }

  const { pageId, trigger, secret } = parsed.data;

  if (secret !== process.env.KEA_WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    await setProcessingStatus(pageId, "Processing");

    const page = await fetchPageText(pageId);
    const taxonomy = await fetchTaxonomy();

    const result = await runClaudeExtraction({
      pageTitle: page.title,
      pageUrl: page.url,
      rawContent: page.content,
      properties: page.properties,
      taxonomy
    });

    const markdown = renderNotionMarkdown(result);
    await replacePageContent(pageId, markdown);
    await updatePageAfterSuccess(pageId, result);

    return res.status(200).json({
      ok: true,
      pageId,
      trigger,
      status: "Complete"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    try {
      await setProcessingStatus(pageId, "Error", message);
    } catch {
      // Avoid masking the original error.
    }

    return res.status(500).json({
      ok: false,
      pageId,
      error: message
    });
  }
}
