import { Client } from "@notionhq/client";
import { truncateForNotionText } from "./render";
import type { ClaudeResult } from "./schema";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function setProcessingStatus(pageId: string, status: "Processing" | "Complete" | "Error", error?: string) {
  const properties: Record<string, any> = {
    "Processing Status": { status: { name: status } }
  };

  if (status === "Error") {
    properties["Formatted"] = { checkbox: false };
    properties["Processing Error"] = { rich_text: [{ text: { content: truncateForNotionText(error || "Unknown error") } }] };
  }

  await notion.pages.update({ page_id: pageId, properties });
}

export async function fetchPageText(pageId: string): Promise<{ title: string | null; url: string | null; content: string; properties: Record<string, unknown> }> {
  const page: any = await notion.pages.retrieve({ page_id: pageId });
  const blocks = await getAllBlocks(pageId);

  const content = blocks
    .map(blockToMarkdown)
    .filter(Boolean)
    .join("\n\n")
    .trim();

  const title = extractTitle(page.properties);

  return {
    title,
    url: page.url || null,
    content,
    properties: simplifyProperties(page.properties || {})
  };
}

async function getAllBlocks(blockId: string): Promise<any[]> {
  const all: any[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100
    });
    all.push(...response.results);
    cursor = response.has_more ? response.next_cursor || undefined : undefined;
  } while (cursor);

  return all;
}

function richTextToPlain(richText: any[] = []): string {
  return richText.map((t) => t.plain_text || "").join("").trim();
}

function blockToMarkdown(block: any): string {
  const type = block.type;
  const value = block[type];
  if (!value) return "";

  if (["paragraph", "quote", "bulleted_list_item", "numbered_list_item", "heading_1", "heading_2", "heading_3"].includes(type)) {
    const text = richTextToPlain(value.rich_text);
    if (!text) return "";
    if (type === "heading_1") return `# ${text}`;
    if (type === "heading_2") return `## ${text}`;
    if (type === "heading_3") return `### ${text}`;
    if (type === "bulleted_list_item") return `- ${text}`;
    if (type === "numbered_list_item") return `1. ${text}`;
    if (type === "quote") return `> ${text}`;
    return text;
  }

  if (type === "to_do") {
    const text = richTextToPlain(value.rich_text);
    return text ? `- [${value.checked ? "x" : " "}] ${text}` : "";
  }

  return "";
}

function extractTitle(properties: Record<string, any>): string | null {
  for (const prop of Object.values(properties)) {
    if (prop?.type === "title") return richTextToPlain(prop.title);
  }
  return null;
}

function simplifyProperties(properties: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, prop] of Object.entries<any>(properties)) {
    if (prop.type === "title") out[key] = richTextToPlain(prop.title);
    else if (prop.type === "rich_text") out[key] = richTextToPlain(prop.rich_text);
    else if (prop.type === "url") out[key] = prop.url;
    else if (prop.type === "select") out[key] = prop.select?.name || null;
    else if (prop.type === "multi_select") out[key] = prop.multi_select?.map((x: any) => x.name) || [];
    else if (prop.type === "status") out[key] = prop.status?.name || null;
    else if (prop.type === "checkbox") out[key] = prop.checkbox;
    else if (prop.type === "number") out[key] = prop.number;
    else if (prop.type === "date") out[key] = prop.date?.start || null;
  }
  return out;
}

export async function fetchTaxonomy(): Promise<string[]> {
  const dataSourceId = process.env.CATEGORY_DATA_SOURCE_ID;
  if (!dataSourceId) return [];

  const response = await notion.databases.query({
    database_id: dataSourceId,
    page_size: 100
  });

  return response.results
    .map((page: any) => extractTitle(page.properties))
    .filter((title): title is string => Boolean(title));
}

async function clearPageBlocks(pageId: string) {
  const blocks = await getAllBlocks(pageId);
  for (const block of blocks) {
    await notion.blocks.delete({ block_id: block.id });
  }
}

function markdownToBlocks(markdown: string): any[] {
  const lines = markdown.split("\n");
  const blocks: any[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) continue;
    if (line === "---") {
      blocks.push({ object: "block", type: "divider", divider: {} });
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ object: "block", type: "heading_3", heading_3: { rich_text: [{ type: "text", text: { content: line.slice(4) } }] } });
    } else if (line.startsWith("## ")) {
      blocks.push({ object: "block", type: "heading_2", heading_2: { rich_text: [{ type: "text", text: { content: line.slice(3) } }] } });
    } else if (line.startsWith("# ")) {
      blocks.push({ object: "block", type: "heading_1", heading_1: { rich_text: [{ type: "text", text: { content: line.slice(2) } }] } });
    } else if (line.startsWith("- ")) {
      blocks.push({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ type: "text", text: { content: line.slice(2).slice(0, 1900) } }] } });
    } else if (line.startsWith("> ")) {
      blocks.push({ object: "block", type: "quote", quote: { rich_text: [{ type: "text", text: { content: line.slice(2).slice(0, 1900) } }] } });
    } else {
      blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: line.slice(0, 1900) } }] } });
    }
  }

  return blocks.slice(0, 100);
}

export async function replacePageContent(pageId: string, markdown: string) {
  await clearPageBlocks(pageId);
  const blocks = markdownToBlocks(markdown);
  if (blocks.length) {
    await notion.blocks.children.append({ block_id: pageId, children: blocks });
  }
}

export async function updatePageAfterSuccess(pageId: string, result: ClaudeResult) {
  const p = result.properties;
  const m = result.metadata;

  const properties: Record<string, any> = {
    "Processing Status": { status: { name: "Complete" } },
    "Formatted": { checkbox: true },
    "Prompt Version": { rich_text: [{ text: { content: process.env.PROMPT_VERSION || "KEA-1.0.0" } }] },
    "Claude Model": { rich_text: [{ text: { content: process.env.CLAUDE_MODEL || "claude-sonnet-4-5" } }] },
    "Summary": { rich_text: [{ text: { content: truncateForNotionText(p.summary) } }] },
    "Importance": { select: { name: p.importance } },
    "Evergreen Score": { number: p.evergreen_score },
    "Knowledge Score": { number: p.knowledge_score },
    "Last Processed": { date: { start: new Date().toISOString() } },
    "Processing Error": { rich_text: [] }
  };

  if (m.title) properties["Article Name"] = { title: [{ text: { content: truncateForNotionText(m.title, 200) } }] };
  if (m.author) properties["Author"] = { rich_text: [{ text: { content: truncateForNotionText(m.author) } }] };
  if (m.source) properties["Source"] = { rich_text: [{ text: { content: truncateForNotionText(m.source) } }] };
  if (m.publication_date) properties["Publication Date"] = { date: { start: m.publication_date } };
  if (m.original_url) properties["URL"] = { url: m.original_url };

  await notion.pages.update({ page_id: pageId, properties });
}
