# Titan AI Model Hub — Phase 0 security setup

Phase 0 adds server-side Firebase ID-token verification and shared Redis quotas. AI endpoints fail closed when either service is not configured. There is deliberately no in-memory fallback for AI quota enforcement.

## Required services

1. Create or select a Firebase project.
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Register a Firebase Web App and configure the four `NEXT_PUBLIC_FIREBASE_*` variables from its web configuration.
4. Set `FIREBASE_PROJECT_ID` to the same Firebase project ID on the server.
5. Create an Upstash Redis database and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as server-side environment variables.
6. Keep `OPENROUTER_API_KEY` server-side. Never use a `NEXT_PUBLIC_` prefix for provider or Redis secrets.

## Environment variables

Copy the variable names from `.env.example` into the hosting environment. Do not commit real values. Configure the public Firebase Web App values for the client and Firebase project ID plus Upstash credentials for the server.

## Enforced controls

| Endpoint | Authentication | Shared limit |
| --- | --- | --- |
| `POST /api/chat` | Firebase ID token | 30/minute, 200/day per user |
| `POST /api/crew` | Firebase ID token + service flag | 1/minute, 3/day per user |

- Request bodies are streamed and capped before JSON parsing (32 KiB chat, 8 KiB Crew).
- Only validated chat roles (`user`, `assistant`) are forwarded; the system prompt remains server-owned.
- Firebase ID tokens are verified against Google's published Secure Token signing keys, issuer, audience, and RS256 algorithm.
- Redis increments use an atomic Lua script and expire automatically.
- Redis outages or missing Redis configuration return HTTP 503. They never fall back to process-local counters.
- No monetary spend ledger exists yet. The per-user daily request quotas are a hard request-count guardrail, not a dollar-denominated cost ceiling. Provider-specific cost accounting remains a later phase.
- Crew remains disabled unless `CREW_API_ENABLED=true` is set after the service and environment are ready.

## Local validation

```bash
npm install
npm run typecheck
npm run build
```

## Important deployment note

After configuring Firebase and Upstash, redeploy the branch preview and test sign-up, sign-in, authenticated chat, invalid/expired tokens, quota exhaustion, missing Redis configuration, and Crew's disabled-by-default behavior. Do not enable Crew or any paid provider until those checks pass.
