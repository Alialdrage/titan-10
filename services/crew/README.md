# Titan Crew Service

This directory contains the standalone Python service used by Titan's CrewAI endpoint.

## Required environment variables

Set these in the Python service host:

- `CREW_API_TOKEN`: a long, random bearer token shared only with the Next.js server.
- `OPENROUTER_API_KEY`: OpenRouter API key.
- `SERPER_API_KEY`: Serper search API key.
- `OPENROUTER_MODEL`: optional model identifier; defaults to `deepseek/deepseek-chat:free`.

Set these in the Next.js deployment:

- `CREW_API_ENABLED`: keep unset or set to anything other than `true` until application-level caller authentication is implemented. Set to `true` only after that authentication is enforced on `POST /api/crew`.
- `CREW_SERVICE_URL`: HTTPS base URL of this Python service.
- `CREW_API_TOKEN`: the same bearer token configured in the Python service.

Never commit these values or paste them into source files.

## Run locally

```bash
python -m pip install -r services/crew/requirements.txt
uvicorn services.crew.main:app --host 127.0.0.1 --port 8000
```

Health check: `GET /health`

Authenticated task endpoint: `POST /crew` with JSON body `{"topic":"..." }` and header `Authorization: Bearer <CREW_API_TOKEN>`.

The Next.js application proxies requests through `POST /api/crew`. The proxy is disabled by default until application-level caller authentication is added and enforced. Once enabled, it validates the request, limits the body to 8 KiB, applies a best-effort per-instance limit of five requests per minute per client IP, and uses a 120-second upstream timeout. The in-memory limit is not shared across serverless instances; use a shared rate-limit store before broad exposure.

The Crew task is created and executed only after an authenticated `POST /crew`; importing the module or calling the health endpoint does not start a task.

## Validation

```bash
python -m py_compile services/crew/main.py
python -m unittest discover -s services/crew -p 'test_*.py' -v
```
