# activations-generator

The generator tool for activations.work — anyone can visit and create a fake award-winning case study.

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import that repo
3. Add these Environment Variables in Vercel's project settings:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (`sk-ant-...`) |
| `GITHUB_TOKEN` | Your GitHub personal access token (`ghp_...`) |
| `GITHUB_REPO` | `Joe-Meier/activations-work` |

4. Deploy. Point a custom domain (e.g. `generator.activations.work`) at it if you want.

## How it works

- `index.html` — the React generator app (no secrets)
- `api/generate.js` — proxies to Anthropic API (key stays server-side)
- `api/publish.js` — proxies to GitHub API (token stays server-side)

Published case studies land at `activations.work/campaign-slug`.
