# ChefGen AI

ChefGen AI is a full-stack recipe generation application that turns a list of ingredients into recipe suggestions, detailed recipe pages, and nutrition-friendly cooking guidance using Google Gemini as the AI backend.

The project combines:
- a responsive static frontend built with HTML, CSS, and vanilla JavaScript
- a FastAPI backend that securely handles Gemini requests
- environment-based configuration for API keys and deployment settings
- local fallback recipe generation when the AI service is unavailable or quota-limited

---

## Project Summary

ChefGen AI helps users:
- enter ingredients they already have
- generate recipe ideas instantly
- open a detailed recipe page for a selected dish
- explore preparation, cooking, nutrition, and health assessment details
- receive a resilient fallback experience when Gemini quota is unavailable

The application is designed to preserve the original UI and user experience while moving AI access behind a production-style backend for better security and control.

---

## Live Demo

A local live demo is available from this workspace. Start both services in separate terminal windows:

```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
python -m http.server 8080
```

Then open the app in your browser at:

- 🌐 Frontend UI: http://127.0.0.1:8080
- 🌐 Backend health check: http://127.0.0.1:8000/api/health

The frontend serves the static application while the backend provides the secure Gemini API proxy and health endpoint.

---

## Core Features

- Ingredient-driven recipe generation
- AI recipe cards with recipe metadata
- Recipe detail page rendering
- Fallback recipe generation when AI is unavailable
- Secure backend-based Gemini integration
- Configurable environment variables
- FastAPI health endpoint and production-ready API structure
- Docker and AWS App Runner deployment support
- Rate-limit aware backend error handling

---

## Architecture

### Frontend
- Static pages: `index.html`, `ingredients.html`, `recipe.html`
- Styling: `css/`
- Browser logic: `js/`

### Backend
- FastAPI application: `backend/app/main.py`
- Environment configuration: `backend/app/settings.py`
- Runtime dependency list: `backend/requirements.txt`

### AI Integration Flow
1. The browser sends a request to the local backend API.
2. The backend reads the Gemini API key and model from environment variables.
3. The backend sends the request to Google Gemini.
4. The result is returned to the frontend.
5. If the Gemini service is unavailable or rate-limited, the UI uses a local fallback recipe generation path.

---

## Technology Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Backend
- Python
- FastAPI
- Uvicorn
- Pydantic
- python-dotenv
- Requests

### AI
- Google Gemini Developer API
- Model configuration via environment variables

### Deployment
- Docker
- Docker Compose
- AWS App Runner
- Firebase hosting support for static frontend assets

---

## Project Structure

```text
ChefGen-AI/
├── app-runner.yaml
├── docker-compose.yml
├── Dockerfile
├── firebase.json
├── index.html
├── ingredients.html
├── recipe.html
├── assets/
├── css/
├── data/
├── js/
├── backend/
│   ├── README.md
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       └── settings.py
└── README.md
```

---

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd ChefGen-AI
```

### 2. Create the Python environment

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 3. Configure environment variables

Copy the environment template if needed:

```bash
copy .env.example .env
```

Then update the file with your values:

```env
APP_NAME=ChefGen AI
APP_ENV=development
HOST=127.0.0.1
PORT=8000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
ALLOWED_ORIGINS=*
```

Important notes:
- `GEMINI_API_KEY` must be set on the backend server.
- `GEMINI_MODEL` should use a supported Google Gemini model name.
- Do not expose the API key in browser-side JavaScript.

---

## Running the Project

### Start the backend

```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### Health check

```bash
http://127.0.0.1:8000/api/health
```

Expected response shape:

```json
{
  "status": "ok",
  "app": "ChefGen AI",
  "environment": "development",
  "model": "gemini-2.0-flash"
}
```

### Start the frontend

Use any static file server such as:
- VS Code Live Server
- Python static server
- Firebase hosting
- Docker container hosting

Example:

```bash
python -m http.server 8080
```

Then open the app in a browser at:

```text
http://127.0.0.1:8080
```

---

## Gemini Integration Notes

### Supported behavior
- The frontend does not call Google Gemini directly.
- The frontend sends the prompt to the FastAPI backend.
- The backend holds the Google API key and performs the request securely.

### Current model guidance
The backend is configured to use a supported Gemini model name via `GEMINI_MODEL`.

### Runtime behavior
- If the Gemini API key is missing, the backend returns a clear server-side error.
- If Google returns a quota or rate-limit response such as `429 Too Many Requests`, the backend retries with backoff and surfaces a clear error message.
- The frontend falls back to local recipe generation when AI generation is unavailable.

---

## Docker and Deployment

### Docker Compose

```bash
docker-compose up --build
```

### Docker

```bash
docker build -t chefgen-ai .
docker run -p 8000:8000 --env-file .env chefgen-ai
```

### AWS App Runner

The repository includes `app-runner.yaml` for AWS App Runner deployment configuration. This project is ready for container-based deployment once AWS credentials and application secrets are configured.

---

## Troubleshooting

### Gemini returns 404
- Check that the configured `GEMINI_MODEL` is currently supported by Google.
- Avoid deprecated model names.

### Gemini returns 429
- The API key has hit a quota or rate-limit threshold.
- Retry later or use a key with available quota.
- The app will gracefully fall back locally if the AI service is temporarily unavailable.

### Gemini returns 401 or 403
- Verify the API key is valid.
- Ensure the backend environment has the key loaded correctly.

### Gemini returns 400 or 500
- Review the server logs and the exact prompt payload.
- Confirm the backend request body matches the current Gemini Developer API format.

---

## Production-Readiness Notes

This project has been updated to follow a more production-ready pattern:
- server-side secret handling
- environment-based configuration
- backend API route structure
- secure AI proxy flow
- deployment files for Docker and AWS App Runner
- graceful fallback behavior

---

## Team

### Team Name
**Team GenAI Pioneers**

### Team Members
- ORUGANTI AKSHITHA
- Talluri Chandana
- Koka Navya Sree

---

## Internship

**IBM SkillsBuild Internship**

**Project Theme:** Generative AI & Cloud Computing

**Project Title:** ChefGen AI – AI-Powered Smart Recipe Generator

---

# 📜 License

This project is developed for educational purposes as part of the **IBM SkillsBuild Internship Program**.

Feel free to learn from, modify, and enhance the project.

---

# ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.

**Happy Cooking with ChefGen AI! 🍳🤖**