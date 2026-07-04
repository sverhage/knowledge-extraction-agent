import fs from "node:fs";
import path from "node:path";

function readPrompt(name: string): string {
  const promptPath = path.join(process.cwd(), "prompts", name);
  return fs.readFileSync(promptPath, "utf8").trim();
}

export function loadSystemPrompt(): string {
  const files = ["system.md", "cleaner.md", "extractor.md", "categorizer.md", "page-builder.md"];
  return files.map((file) => `# ${file}\n\n${readPrompt(file)}`).join("\n\n---\n\n");
}
