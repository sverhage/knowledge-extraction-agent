# Knowledge Extraction Agent

A Vercel + Claude + Notion starter project for formatting saved articles in Sasha's Notion Article Tracker.

## What it does

`POST /api/format-article`

1. Receives a Notion page ID.
2. Fetches the Notion page content.
3. Sends the content to Claude using the KEA prompt.
4. Replaces the page body with:
   - Summary by Claude
   - Cleaned Article
5. Updates Notion properties:
   - Processing Status
   - Formatted
   - Prompt Version
   - Claude Model
   - Last Processed
   - Summary
   - Source
   - Author
   - Publication Date
   - Importance
   - Evergreen Score
   - Knowledge Score

## Required environment variables

See `.env.example`.

## Local development

```bash
npm install
npm run dev
```

## Test request

```bash
curl -X POST http://localhost:3000/api/format-article \
  -H "Content-Type: application/json" \
  -d '{"pageId":"YOUR_PAGE_ID","trigger":"manual","secret":"YOUR_SECRET"}'
```

## Deployment

Deploy on Vercel and add all environment variables in Project Settings → Environment Variables.
