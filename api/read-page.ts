import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "@notionhq/client";

const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const pageId = String(req.query.pageId ?? "");

    if (!pageId) {
        return res.status(400).json({
            ok: false,
            error: "Missing pageId"
        });
    }

    try {
        const page = await notion.pages.retrieve({ page_id: pageId });

        return res.status(200).json({
            ok: true,
            pageId,
            object: page.object,
            url: "url" in page ? page.url : null,
            properties: "properties" in page ? page.properties : null
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            pageId,
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}