# Titan Crew Service

This directory contains the standalone Python service used by Titan's CrewAI endpoint.

## Required environment variables

Set these in the Python service host:

- `CREW_API_TOKEN`: a long, random bearer token of at least 32 characters, shared only with the Next.js server.
- `OPENROUTER_API_KEY`: OpenRouter API key.
- `SERPER_API_KEY`: Serper search API key.
- `OPENROUTER_MODEL`: optional model identifier; defaults to `deepseek/deepseek-chat:free`.

Set these in the Next.js deployment:

- `CREW_API_ENABLED`: keep unset or set to anything other than `true` until the Python service is deployed and all preview checks pass.
- `CREW_SERVICE_URL`: HTTPS base URL of this Python service (localhost HTTP is allowed only for local development).
- `CREW_API_TOKEN`: the same high-entropy bearer token configured in the Python service.

Never commit these values or paste them into source files.

## Run locally

```bash
python -m pip install -r services/crew/requirements.txt
uvicorn services.crew.main:app --host 127.0.0.1 --port 8000
```

Health check: `GET /health`

Authenticated task endpoint: `POST /crew` with JSON body `{"topic":"..."}` and header `Authorization: Bearer <CREW_API_TOKEN>`.

The Next.js application proxies requests through `POST /api/crew`. The proxy is disabled by default. When explicitly enabled, it requires Firebase authentication and shared Redis quotas (1 request/minute and 3/day per user), limits request and upstream response sizes, rejects redirects, and applies a 120-second timeout. The quota is shared across serverless instances; it is not an in-memory per-IP counter.

The Crew task is created and executed only after an authenticated `POST /crew`; importing the module or calling the health endpoint does not start a task. Crew remains disabled until its deployed service, credentials, preview authentication, quota behavior, and cost controls have been verified.

## Validation

```bash
python -m py_compile services/crew/main.py
python -m unittest discover -s services/crew -p 'test_*.py' -v
```
