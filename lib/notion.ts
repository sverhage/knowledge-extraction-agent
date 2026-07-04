import { Client } from "@notionhq/client";
import { config } from "./config";

export function getNotionClient() {
  if (!config.notionToken) {
    throw new Error("Missing NOTION_TOKEN");
  }

  return new Client({ auth: config.notionToken });
}
