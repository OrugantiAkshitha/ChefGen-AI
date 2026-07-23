from __future__ import annotations

import asyncio
import json
import logging
import time
from pathlib import Path
from typing import Any, AsyncGenerator

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.app.settings import settings

logger = logging.getLogger("chefgen.gemini")
logger.setLevel(logging.INFO)

ROOT_DIR = Path(__file__).resolve().parents[2]

app = FastAPI(
    title="ChefGen AI API",
    version="1.0.0",
    description="Production-ready FastAPI backend for the ChefGen AI recipe generator.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.allowed_origins == ["*"] else settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AIRequest(BaseModel):
    prompt: str
    stream: bool = False


class RecipeRequest(BaseModel):
    ingredients: str


@app.get("/api/health")
def health_check() -> dict[str, Any]:
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.app_env,
        "model": settings.gemini_model,
    }


def _extract_gemini_error_details(response: requests.Response) -> str:
    try:
        payload = response.json()
        error_payload = payload.get("error", {}) if isinstance(payload, dict) else {}
        message = error_payload.get("message") or payload.get("message") or response.text
        return str(message).strip()
    except Exception:
        return response.text.strip() or f"HTTP {response.status_code}"


def _map_gemini_http_error(status_code: int, detail: str) -> HTTPException:
    message = f"Gemini API request failed with status {status_code}: {detail}"
    if status_code == 400:
        return HTTPException(status_code=400, detail=message)
    if status_code == 401:
        return HTTPException(status_code=401, detail=message)
    if status_code == 403:
        return HTTPException(status_code=403, detail=message)
    if status_code == 404:
        return HTTPException(status_code=404, detail=message)
    if status_code == 429:
        return HTTPException(status_code=429, detail=message)
    return HTTPException(status_code=502, detail=message)


def get_gemini_response(prompt: str) -> str:
    if not settings.gemini_api_key:
        logger.error("Gemini integration failed: GEMINI_API_KEY is not configured on the server.")
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured on the server.",
        )

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent?key="
        f"{settings.gemini_api_key}"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.9,
            "topP": 0.9,
            "maxOutputTokens": 900,
        },
    }

    last_error: Exception | None = None
    for attempt in range(1, 5):
        try:
            logger.info("Sending Gemini request using model %s (attempt %s/4).", settings.gemini_model, attempt)
            response = requests.post(url, json=payload, timeout=60)

            if response.status_code == 429:
                backoff_seconds = min(2 ** (attempt - 1), 8)
                detail = _extract_gemini_error_details(response)
                logger.warning(
                    "Gemini returned HTTP 429 (rate limit). Retrying in %s seconds. Detail: %s",
                    backoff_seconds,
                    detail,
                )
                if attempt == 4:
                    raise _map_gemini_http_error(429, detail)
                time.sleep(backoff_seconds)
                continue

            if response.status_code in {400, 401, 403, 404, 500}:
                detail = _extract_gemini_error_details(response)
                logger.error(
                    "Gemini request failed with HTTP %s for model %s. Detail: %s",
                    response.status_code,
                    settings.gemini_model,
                    detail,
                )
                raise _map_gemini_http_error(response.status_code, detail)

            response.raise_for_status()
            data = response.json()
            break
        except HTTPException:
            raise
        except requests.RequestException as exc:
            last_error = exc
            logger.error("Gemini request raised a transport error on attempt %s: %s", attempt, exc)
            if attempt == 4:
                raise HTTPException(status_code=502, detail=f"AI request failed: {exc}") from exc
            time.sleep(1 * attempt)
    else:
        if last_error is not None:
            raise HTTPException(status_code=502, detail=f"AI request failed: {last_error}") from last_error

    text_parts: list[str] = []
    try:
        candidates = data.get("candidates", [])
        for candidate in candidates:
            content = candidate.get("content", {})
            for part in content.get("parts", []):
                text = part.get("text")
                if text:
                    text_parts.append(text)
    except Exception as exc:
        logger.exception("Gemini response parsing failed.")
        raise HTTPException(status_code=500, detail=f"Failed to parse Gemini response: {exc}") from exc

    if not text_parts:
        logger.error("Gemini returned a successful HTTP response but no usable text content.")
        raise HTTPException(status_code=500, detail="Gemini returned an empty response.")

    logger.info("Gemini request completed successfully with %s text part(s).", len(text_parts))
    return "".join(text_parts).strip()


@app.post("/api/ai/generate")
def generate_text(payload: AIRequest) -> JSONResponse:
    response_text = get_gemini_response(payload.prompt)
    return JSONResponse({"response": response_text})


@app.post("/api/ai/stream")
async def stream_text(payload: AIRequest) -> StreamingResponse:
    response_text = get_gemini_response(payload.prompt)

    async def stream() -> AsyncGenerator[str, None]:
        chunks = [response_text[i : i + 120] for i in range(0, len(response_text), 120)]
        for chunk in chunks:
            yield f"data: {json.dumps({'text': chunk})}\n\n"
            await asyncio.sleep(0.05)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@app.post("/api/recipes/generate")
def generate_recipes(payload: RecipeRequest) -> JSONResponse:
    return JSONResponse(
        {
            "recipes": [
                {
                    "name": "ChefGen Demo Recipe",
                    "summary": "Generated through the backend API.",
                    "estimatedTime": "30 mins",
                    "difficulty": "Easy",
                    "ingredients": payload.ingredients.split(","),
                    "preparationTime": "10 mins",
                    "cookingTime": "20 mins",
                    "servings": "2-3",
                }
            ]
        }
    )


app.mount("/", StaticFiles(directory=str(ROOT_DIR), html=True), name="static")
