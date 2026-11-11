# Titan Crew Service

This is a separate Python service. It is intentionally outside the Next.js App Router.

## Required environment

- `CREW_API_TOKEN`: long random shared secret used only between the Next.js server and this service.
- `OPENROUTER_API_KEY`: server-side OpenRouter key.
- `SERPER_API_KEY`: server-side Serper key for real web research.
- `OPENROUTER_MODEL` (optional): OpenRouter model identifier; defaults to `deepseek/deepseek-chat:free`.

Never commit these values or expose them to browser code.

## Run

Use Python 3.12 or newer:

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r services/crew/requirements.txt
uvicorn services.crew.main:app --host 0.0.0.0 --port 8000
```

Configure the Next.js deployment with:

- `CREW_SERVICE_URL`: HTTPS base URL of this separately deployed service.
- `CREW_API_TOKEN`: the same service token configured above.

The Next.js endpoint is `POST /api/crew` with JSON `{"topic":"..." }`. The service endpoint is `POST /crew` and requires a Bearer token.

The service returns HTTP 503 when required provider credentials are missing. No CrewAI task is executed during module import or health checks.
