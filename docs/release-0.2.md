# KEA Release 0.2

## Goal

Prove that Vercel is running the app and that environment variables are available.

## Added

- `/api/health`
- config helper
- Anthropic client helper
- Notion client helper
- request validation schema
- structured JSON responses
- improved README
- `.env.example`
- `.gitignore`

## Verification

After pushing to GitHub and Vercel redeploys, visit:

```text
https://knowledge-extraction-agent-sasha.vercel.app/api/health
```

Success means you see JSON with `status: ok`.
