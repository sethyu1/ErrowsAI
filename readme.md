# Errows

Errows is an AI character platform: users create and chat with AI characters through text, voice calls, and generated images/videos, share characters and posts in a community feed, and pay for usage with a coin balance funded via Stripe.

**Live site:** https://errows.ai

## Features

- **AI chat** — streaming character conversations with persona/memory support
- **Voice calls** — real-time voice conversations powered by Agora ConvoAI (LLM + ASR + TTS)
- **Image & video generation** — character avatars, greetings, and user-requested media
- **Community** — character sharing, posts, comments, likes, and follows
- **Payments** — coin economy with Stripe checkout (subscriptions and one-time top-ups)
- **Auth** — email/password with verification mail, Google OAuth, SMS OTP
- **Admin console** — content moderation and operations dashboard

## Repository layout

This is a pnpm monorepo (`pnpm@10.19`, Node ≥ 18).

| Path | Package | Description |
|---|---|---|
| `apps/errows-web` | `errows-web` | User-facing web app — React 19 + Vite + Tailwind, wrapped with Capacitor for mobile |
| `apps/errows-app` | `errows-app` | Capacitor 8 Android shell for the mobile app |
| `apps/errows-app-download` | — | App download landing page |
| `apps/errows-console` | `errows-console` | Admin console — React 19 + Ant Design (dev port 9528) |
| `backend/errows` | `@errows/server` | API server — Moleculer microservices, REST gateway on port 5003, PostgreSQL |
| `backend/ai` | `@errows/ai` | AI provider integrations (chat, image, video, TTS) |
| `backend/mailer` | — | Transactional email (SMTP) |
| `backend/models` | `@errows/models` | Shared data models and DB migrations tooling |
| `backend/types`, `backend/utils`, `backend/typescript-config` | — | Shared types, utilities, and TS config |

## Getting started

### Prerequisites

- Node.js ≥ 18 and pnpm 10
- PostgreSQL (a database named `errows`)

### Install

```bash
pnpm install
```

### Configure

Backend configuration lives in `backend/errows/config/` and is loaded by the [`config`](https://www.npmjs.com/package/config) package, merged by environment: `default.mjs` → `{NODE_ENV}.mjs` → `local-{NODE_ENV}.mjs`. **Do not put secrets in the tracked files.** Provide them via environment variables, or via a git-ignored local override (anything matching `backend/*/config/local*` is ignored):

```js
// backend/errows/config/local-development.mjs
export default {
  pg: { password: '...' },
  jwt: { secret: '...' },
  stripe: { apiKey: 'sk_test_...', webhookSecret: 'whsec_...' },
  ai: { chat: { endpoint: 'http://...' } },
  // ...override any other keys from default.mjs
}
```

Environment variables read by the config files:

| Variable | Purpose |
|---|---|
| `PG_PASSWORD` | PostgreSQL password (production) |
| `JWT_SECRET` | JWT signing secret |
| `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET_FALLBACK` | Stripe payments |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | S3 asset storage |
| `AI_API_KEY` | Internal AI gateway |
| `AI_IMAGE_ENDPOINT`, `AI_CHAT_ENDPOINT`, `AI_STREAM_ENDPOINT`, `AI_VIDEO_ENDPOINT`, `AI_VIDEO_STATE_ENDPOINT`, `AI_TTS_ENDPOINT`, `AI_VOICE_CALL_ENDPOINT` | AI backend service endpoints |
| `XAI_API_KEY` | xAI (Grok) — character refine & voice-call LLM |
| `MINIMAX_GROUP_ID`, `MINIMAX_TTS_KEY` | MiniMax TTS for voice calls |
| `AGORA_APP_CERTIFICATE`, `AGORA_CUSTOMER_ID`, `AGORA_CUSTOMER_SECRET` | Agora RTC / ConvoAI |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `NOTION_API_KEY`, `NOTION_DATABASE_ID` | Notion integration |
| `SMTP_PASSWORD` | Transactional mail |
| `SMS_PASSWORD` | SMS OTP gateway |
| `HOST_ORIGIN` | Public origin override |

Frontend configuration is in `apps/errows-web/.env` and `apps/errows-console/.env` (dev ports and API host only — never secrets, `VITE_*` values are bundled into the client).

### Database

```bash
pnpm errowsctl bootstrap            # create schema
pnpm errowsctl migration upgrade    # run migrations (backend/errows/db/migrations)
```

### Run

```bash
pnpm server dev        # API server with hot reload (http://localhost:5003)
pnpm start             # errows-web dev server
pnpm start:console     # admin console dev server (http://localhost:9528)
```

### Test

```bash
pnpm server test       # backend vitest suite
```

## Deployment

Each deployable has a `deploy.sh` / `deploy.pro.sh` that rsyncs a build to the target host over SSH and restarts the systemd unit (see `backend/errows/docs/deploy.md`). The backend exposes Prometheus metrics on port 3030 at `/metrics`.

## Development notes

<details>
<summary>shadcn/radix Dialog recipes</summary>

Hide the close button:

```tsx
<DialogContent className="[&>button]:hidden">
```

Don't close on overlay click:

```tsx
<DialogContent onInteractOutside={(e) => e.preventDefault()}>
```

Don't auto-focus:

```tsx
<DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
```

</details>
