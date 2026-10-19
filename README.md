# FO—WAVE

Next.js site for FO—WAVE, deployed to Cloudflare Workers with [OpenNext](https://opennext.js.org/cloudflare).

## Local development

```bash
npm install
npm run dev
```

Create `.env.local` with the Web3Forms key used by the contact form:

```bash
NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=your-key
```

Copy `.dev.vars.example` to `.dev.vars` before running the Workers preview.

## Cloudflare Workers

| Command | What it does |
| --- | --- |
| `npm run preview` | Builds with OpenNext and runs the site locally in the Workers runtime |
| `npm run deploy` | Builds and deploys to the `fo-wave` Worker |
| `npm run upload` | Builds and uploads a new version without promoting it |
| `npm run cf-typegen` | Regenerates `cloudflare-env.d.ts` after changing `wrangler.jsonc` |

Run `npx wrangler login` once before the first deploy.

`NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` is inlined at build time, so it must be present wherever the build runs: in `.env.local` for local deploys, or as a **build** variable in Workers Builds when deploying from GitHub.

Image optimization uses the Cloudflare Images binding (`IMAGES` in `wrangler.jsonc`).

## Notes

- `cacheComponents` is disabled: Next.js Cache Components currently hangs requests in the Workers runtime. Every page is statically prerendered, so nothing depends on it.
- If styles look stale in development, stop the dev server, run `rm -rf .next/dev`, and start it again.
