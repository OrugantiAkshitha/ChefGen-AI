# ChefGen AI FastAPI Backend

This backend service exposes a secure API layer for the ChefGen AI frontend.

## Run locally

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

Copy `.env.example` to `.env` and set:

- `GEMINI_API_KEY`
- `APP_ENV`
- `HOST`
- `PORT`
- `ALLOWED_ORIGINS`
