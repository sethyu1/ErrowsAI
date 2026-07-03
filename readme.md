# Errows

Errows is a full-stack **AI character platform**: users create AI characters with rich personas, chat with them through streaming text, real-time voice calls, and generated images/videos, share characters and posts in a community feed, and pay for usage through a coin economy funded via Stripe.

**Live site:** https://errows.ai

## Features

- **Character creation** — guided builder (gender, style, personality, appearance) with AI-assisted persona refinement (xAI Grok), AI-generated avatars, greetings, and backgrounds
- **AI chat** — streaming character conversations with persona and session memory, message-level media (images, videos, voice)
- **Voice calls** — real-time voice conversations powered by Agora RTC + ConvoAI (LLM + ASR + MiniMax TTS pipeline)
- **Image & video generation** — user-requested media generation with per-character model parameters and async task tracking
- **Community** — character sharing, posts, comments, likes, follows, and content feedback
- **Monetization** — coin balance, membership plans, subscriptions and one-time top-ups via Stripe Checkout (with webhook fallback for a legacy account), gift items, CD-key redemption, and daily/recurring reward tasks
- **Auth** — email/password with verification mail, Google OAuth, SMS OTP login
- **Growth & analytics** — Meta/Reddit/X pixel integration, user login logs, member statistics, Notion-backed content, Prometheus metrics + Grafana dashboards
- **Admin console** — operations dashboard (usage, LLM calls, revenue), member/plan management, character and post moderation, generation-parameter tuning, LLM debugging, permission groups, i18n string management, and product configuration (coins, gifts, CD keys, home-page curation, legal pages)

## Architecture

```
apps/errows-web ──┐                       ┌─ user.service     (auth, profiles, OAuth, SMS)
apps/errows-app ──┼─▶ nginx ─▶ api.service ├─ errows.service   (characters, chat, sessions, posts, media)
apps/errows-console┘   (REST :5003)        ├─ payment.service  (Stripe, coins, plans, gifts)
                                           └─ ops.service      (console/admin operations)
```

- **Backend** is a set of [Moleculer](https://moleculer.services/) microservices communicating over a TCP transporter. `api.service` is the REST gateway; the others own their domains and can be deployed/restarted independently (`errows@<name>` systemd units).
- **PostgreSQL** stores users, characters, sessions/messages, posts/comments, members/plans, purchases, gifts, tasks, and CD keys. Schema lives in `backend/errows/db/migrations` (plain SQL, applied via `errowsctl`).
- **Media pipeline**: generation requests are queued as tasks; workers call external AI endpoints (chat/stream/image/video/TTS — configured per environment) and upload results to S3, which serves as the public CDN.
- **Voice calls**: the backend issues Agora RTC tokens and starts a ConvoAI agent in the user's channel, wiring the character's persona into the LLM and its voice into MiniMax TTS.
- **Observability**: each node exposes Prometheus metrics on `:3030/metrics`; Grafana dashboards for AI requests, purchases, and user activity are in `config/grafana/`.

## Repository layout

This is a pnpm monorepo (`pnpm@10.19`, Node ≥ 18).

| Path | Package | Description |
|---|---|---|
| `apps/errows-web` | `errows-web` | User-facing web app — React 19 + Vite + Tailwind, wrapped with Capacitor for mobile. Pages: home, character browse/create, chat, media generation, community posts, plans & coins, account |
| `apps/errows-app` | `errows-app` | Capacitor 8 Android shell for the mobile app |
| `apps/errows-app-download` | — | App download landing page |
| `apps/errows-console` | `errows-console` | Admin console — React 19 + Ant Design (dev port 9528) |
| `backend/errows` | `@errows/server` | API server — Moleculer services, REST gateway on port 5003, PostgreSQL, migrations, static product config |
| `backend/ai` | `@errows/ai` | AI provider integrations (chat, image, video, TTS) |
| `backend/mailer` | — | Transactional email (SMTP) |
| `backend/models` | `@errows/models` | Shared data models and DB tooling |
| `backend/types`, `backend/utils`, `backend/typescript-config` | — | Shared types, utilities, and TS config |
| `config/` | — | Server provisioning: nginx snippets, systemd units, Grafana dashboards, sudoers |

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

Each deployable has a `deploy.sh` / `deploy.pro.sh` that builds, rsyncs to the target host over SSH, and restarts the systemd unit (see `backend/errows/docs/deploy.md`). Server provisioning files (nginx, systemd, sudoers) live in `config/` and are synced to `/srv/etc/`. Frontends deploy as timestamped releases with a symlink flip for instant rollback.

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

## License

[MIT](LICENSE)
