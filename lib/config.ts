export const config = {
  serviceName: "knowledge-extraction-agent",
  release: "0.2.0",
  promptVersion: process.env.PROMPT_VERSION ?? "KEA-1.0.0",
  claudeModel: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5",
  webhookSecret: process.env.KEA_WEBHOOK_SECRET ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  notionToken: process.env.NOTION_TOKEN ?? ""
};

export function getConfigHealth() {
  return {
    hasAnthropicKey: Boolean(config.anthropicApiKey),
    hasNotionToken: Boolean(config.notionToken),
    hasWebhookSecret: Boolean(config.webhookSecret),
    claudeModel: config.claudeModel,
    promptVersion: config.promptVersion
  };
}
