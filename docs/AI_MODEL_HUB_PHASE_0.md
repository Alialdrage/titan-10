# Titan AI Model Hub — Phase 0 security setup

Phase 0 adds server-side Firebase ID-token verification and shared Redis quotas. AI endpoints fail closed when either service is not configured. There is deliberately no in-memory fallback for AI quota enforcement.

## Required services

1. Create or select a Firebase project.
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Register a Firebase Web App and configure the four `NEXT_PUBLIC_FIREBASE_*` variables from its web configuration.
4. Set both `FIREBASE_PROJECT_ID` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID` to the exact same Firebase project ID.
5. Create an Upstash Redis database and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as server-side environment variables. The REST URL must use HTTPS.
6. Keep `OPENROUTER_API_KEY` server-side. Never use a `NEXT_PUBLIC_` prefix for provider or Redis secrets.

## Environment variables

Copy the variable names from `.env.example` into the hosting environment. Configure public Firebase Web App values for the client and Firebase project ID plus Upstash credentials for the server. Never commit actual values.

## Enforced controls

| Endpoint | Authentication | Shared limit |
| --- | --- | --- |
| `POST /api/chat` | Firebase ID token | 30/minute, 200/day per user |
| `POST /api/crew` | Firebase ID token + service flag | 1/minute, 3/day per user |
| `POST /api/search` | Disabled (no provider configured) | 8 KiB request body |

- JSON endpoints require `Content-Type: application/json`; bodies are streamed and capped before JSON parsing (32 KiB chat, 8 KiB Crew/search).
- Chat messages accept only `user` and `assistant` roles, alternate roles, and end with a user message. The system prompt remains server-owned.
- Firebase ID tokens are verified against Google's published Secure Token signing keys, issuer, audience, RS256 algorithm, and required Firebase token claims.
- Server and public Firebase project IDs must match exactly.
- Redis checks and increments both quota windows atomically. Rejected requests do not consume additional quota.
- Redis outages or missing/malformed Redis configuration return HTTP 503. They never fall back to process-local counters.
- The daily quota resets at 00:00 UTC. The minute quota uses a fixed 60-second window from first use.
- No monetary spend ledger exists yet. Per-user request quotas are guardrails, not a dollar-denominated cost ceiling. Provider-specific cost accounting remains required before paid model routing.
- Crew remains disabled unless `CREW_API_ENABLED=true` is set after its service, credentials, preview auth, quotas, and cost controls are verified.
- Image prompts are sent to Pollinations over HTTPS. Do not send confidential or personal information in image prompts.

## Local validation

```bash
npm install
npm run typecheck
npm run build
```

## Preview validation before enabling paid services

After configuring Firebase and Upstash, redeploy the branch preview and test sign-up, sign-in, valid/invalid/expired tokens, quota exhaustion, missing Redis configuration, oversized and invalid-UTF8 bodies, and Crew's disabled-by-default behavior. Do not enable Crew or any paid provider until those checks pass.
