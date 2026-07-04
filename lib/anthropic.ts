import Anthropic from "@anthropic-ai/sdk";
import { ClaudeResultSchema, type ClaudeResult } from "./schema";
import { loadSystemPrompt } from "./prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

function extractTextBlock(message: Anthropic.Messages.Message): string {
  const parts = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text);

  return parts.join("\n").trim();
}

export async function runClaudeExtraction(input: {
  pageTitle: string | null;
  pageUrl: string | null;
  rawContent: string;
  properties: Record<string, unknown>;
  taxonomy: string[];
}): Promise<ClaudeResult> {
  const system = loadSystemPrompt();

  const userPayload = {
    page_title: input.pageTitle,
    page_url: input.pageUrl,
    raw_content: input.rawContent,
    page_properties: input.properties,
    existing_taxonomy: input.taxonomy
  };

  const message = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
    max_tokens: 8000,
    temperature: 0.2,
    system,
    messages: [
      {
        role: "user",
        content: `Process this Notion article page. Return valid JSON only.\n\n${JSON.stringify(userPayload, null, 2)}`
      }
    ]
  });

  const text = extractTextBlock(message);
  const parsedJson = JSON.parse(text);
  return ClaudeResultSchema.parse(parsedJson);
}
