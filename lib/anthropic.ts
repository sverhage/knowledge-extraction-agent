import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config";

export function getAnthropicClient() {
  if (!config.anthropicApiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  return new Anthropic({ apiKey: config.anthropicApiKey });
}
