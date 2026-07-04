import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "@notionhq/client";

const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

function extractTextFromRichText(richText: any[] | undefined): string {
    if (!richText || !Array.isArray(richText)) return "";
    return richText.map((item) => item.plain_text ?? "").join("");
}

function blockToText(block: any): string {
    const type = block.type;
    const value = block[type];

    if (!value) return "";

    const text = extractTextFromRichText(value.rich_text);

    switch (type) {
        case "heading_1":
            return `# ${text}`;
        case "heading_2":
            return `## ${text}`;
        case "heading_3":
            return `### ${text}`;
        case "bulleted_list_item":
            return `- ${text}`;
        case "numbered_list_item":
            return `1. ${text}`;
        case "quote":
            return `> ${text}`;
        case "paragraph":
            return text;
        case "to_do":
            return `- [${value.checked ? "x" : " "}] ${text}`;
        case "toggle":
            return `- ${text}`;
        case "callout":
            return text;
        case "divider":
            return "---";
        default:
            return text;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const pageId = String(req.query.pageId ?? "");

    if (!pageId) {
        return res.status(400).json({
            ok: false,
            error: "Missing pageId"
        });
    }

    try {
        const blocks = await notion.blocks.children.list({
            block_id: pageId,
            page_size: 100
        });

        const textBlocks = blocks.results
            .map((block) => blockToText(block))
            .filter(Boolean);

        const markdown = textBlocks.join("\n\n");

        return res.status(200).json({
            ok: true,
            pageId,
            blockCount: blocks.results.length,
            hasMore: blocks.has_more,
            markdownPreview: markdown.slice(0, 4000),
            markdown
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            pageId,
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}