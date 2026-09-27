# InstaV2 
#Live Link: https://insta-v2-opal.vercel.app/

> **Note**: This repository contains the foundational serverless architecture for an Instagram-like full-stack web application. It establishes the unified Flask + FastAPI serverless runtime, MongoDB Atlas connection pooling, and extensible project structure. Full Instagram features (authentication, post creation, feeds, media uploads) and the custom recommendation engine will be integrated step-by-step in future phases.

---

## 1. Project Purpose

The purpose of this project is to build a modern, high-performance, serverless full-stack web application inspired by Instagram. 

Key architectural goals:
- **Serverless-First**: Designed natively for zero-maintenance, auto-scaling deployment on **Vercel Serverless Functions**.
- **Dual-Framework Architecture**:
  - **Flask (Jinja2)** manages the web user interface, template rendering, and page routing.
  - **FastAPI** handles high-throughput asynchronous API endpoints, health checks, and future JSON APIs.
- **Unified Entrypoint**: A single entry point (`api/index.py`) dynamically routes API and web requests without needing separate frontend/backend deployments or permanently running servers.
- **Future-Proof Extensibility**: Clean boundaries for data models, shared services, and a dedicated integration space for a custom recommendation system.

---

## 2. Technology Stack

- **Python 3.10+**: Core programming language.
- **Flask**: Web framework for Jinja2 template rendering and web routes.
- **FastAPI**: Modern, fast ASGI framework for API endpoints.
- **PyMongo**: MongoDB driver configured with connection pooling optimized for serverless lifecycles.
- **a2wsgi / Mangum**: WSGI-to-ASGI bridge enabling Flask and FastAPI to run in a single unified ASGI serverless container.
- **python-dotenv**: Environment variable management.
- **Vercel**: Serverless hosting platform.

---

## 3. Project Structure

```text
.
├── api/
│   └── index.py             # Serverless entrypoint (mounts Flask on FastAPI ASGI)
│
├── app/
│   ├── __init__.py          # Flask application factory and configuration
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   └── web.py           # Flask web routes (e.g., '/', rendering Jinja2 templates)
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── fastapi_app.py   # FastAPI instance & routes (e.g., '/api/health')
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   └── mongodb.py       # MongoDB Atlas connection manager & health checks
│   │
│   ├── models/
│   │   └── __init__.py      # Schema and model declarations (for future collections)
│   │
│   ├── services/
│   │   └── __init__.py      # Shared business logic & recommendation boundaries
│   │
│   ├── templates/
│   │   ├── base.html        # Base HTML layout with modern styling
│   │   └── index.html       # Landing page template
│   │
│   └── static/
│       ├── css/
│       │   └── style.css    # Clean foundational styles
│       ├── js/
│       │   └── main.js      # Client-side initialization script
│       └── images/          # Static images directory
│
├── .env.example             # Template for required environment variables
├── .gitignore               # Ignored files (secrets, virtual environments, cache)
├── requirements.txt         # Project dependencies
├── vercel.json              # Vercel serverless routing configuration
└── README.md                # Project documentation
```

---

## 4. Architecture Overview

```text
                     Incoming Request (Vercel)
                                │
                                ▼
                         api/index.py
                                │
              ┌─────────────────┴─────────────────┐
              │ (Matched /api/*)                  │ (Fallback / web / static)
              ▼                                   ▼
        FastAPI App                         Flask App
      (app/api/fastapi_app.py)            (app/routes/web.py)
              │                                   │
              │ JSON APIs                         │ Jinja2 Templates & Static UI
              └─────────────────┬─────────────────┘
                                │
                                ▼
                       MongoDB Atlas Layer
                     (app/database/mongodb.py)
                                │
                    Shared Services & Models
                     (app/services/, app/models/)
```

---

## 5. MongoDB Atlas Setup & Planned Schema

### Connection Pooling for Serverless
In serverless environments, functions are created and destroyed dynamically. Creating a new database connection on every request can overwhelm database connection limits and introduce latency. 

The connection manager in [`app/database/mongodb.py`](file:///c:/Users/Acer/Documents/Vivek/Social-Apps/Insta-V2/app/database/mongodb.py) implements a global singleton client with connection pooling (`maxPoolSize=10`, `minPoolSize=0`, `maxIdleTimeMS=30000`). Warm serverless instances reuse active connections seamlessly.

### Planned Future Collections
When full features are implemented, the following collections will be used:
1. `users`: User profiles, credentials, bio, avatars, and account settings.
2. `posts`: Photos, videos, captions, geotags, and creation metadata.
3. `comments`: Post comments and nested replies.
4. `likes`: Post and comment like relationships.
5. `follows`: Graph of follower and following relationships.
6. `saved_posts`: Bookmarked posts per user.
7. `notifications`: Real-time and persisted activity alerts.
8. `stories`: Ephemeral 24-hour media stories.
9. `conversations`: Direct messaging thread metadata.
10. `messages`: Direct message content.
11. `recommendation_events`: Interaction tracking (views, dwell time, engagements) reserved for feeding the custom recommendation engine.

---

## 6. Recommendation Engine Integration Plan

The recommendation engine is intentionally decoupled from core presentation and storage logic. 

Future architecture:
```text
Home Feed Pipeline
       │
       ├── Following Feed (chronological query from 'follows' + 'posts')
       │
       └── Recommendation Service (app/services/recommendation_service.py)
                 │
                 └── Custom Recommendation Algorithm
```

No hardcoded or mock recommendation logic is included at this stage, leaving a clean architectural contract for independent development.

---

## 7. Local Development Setup

### Prerequisites
- Python 3.10 or higher
- pip and venv

### 1. Clone & create virtual environment
```bash
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Fill in your configuration:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=instagram_db
SECRET_KEY=your-secure-random-secret-key
```

### 4. Run the local development server
```bash
python api/index.py
```
Or directly with Uvicorn:
```bash
uvicorn api.index:app --reload --port 5000
```

Open your browser and navigate to:
- **Flask Web UI**: [http://localhost:5000/](http://localhost:5000/)
- **FastAPI Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Database Health Check**: [http://localhost:5000/api/health/db](http://localhost:5000/api/health/db)
- **FastAPI Interactive Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 8. API Endpoints

| Method | Route | Handler | Description |
|---|---|---|---|
| `GET` | `/` | Flask | Landing page rendering `templates/index.html` |
| `GET` | `/static/*` | Flask | Static stylesheets, JavaScript, and images |
| `GET` | `/api/health` | FastAPI | Returns `{"status": "ok"}` |
| `GET` | `/api/health/db` | FastAPI | Safe status of MongoDB Atlas connectivity |
| `GET` | `/api/docs` | FastAPI | Interactive OpenAPI/Swagger documentation |

---