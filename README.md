# Knowledge Extraction Agent

A lightweight Vercel + Claude + Notion service that turns saved articles into structured knowledge notes.

## Current Release

KEA Release 0.2

## What works now

- `/api/health` confirms the deployment is live.
- `/api/format-article` validates incoming requests and returns a scaffold response.
- Anthropic and Notion clients are configured for the next release.
- Environment variables are read safely from Vercel.

## Required Environment Variables

- `ANTHROPIC_API_KEY`
- `NOTION_TOKEN`
- `KEA_WEBHOOK_SECRET`
- `CLAUDE_MODEL`
- `PROMPT_VERSION`

## Test Health Endpoint

Visit:

```text
https://YOUR-PROJECT.vercel.app/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "knowledge-extraction-agent",
  "release": "0.2.0",
  "promptVersion": "KEA-1.0.0",
  "hasAnthropicKey": true,
  "hasNotionToken": true
}
```

## Test Format Endpoint

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/format-article \
  -H "Content-Type: application/json" \
  -d '{"pageId":"test-page-id","trigger":"manual","secret":"YOUR_WEBHOOK_SECRET"}'
```

## Next Release

KEA Release 0.3 will connect the live endpoint to Claude and Notion page content.
