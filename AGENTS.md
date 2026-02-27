# AGENTS.md - IPN Documentation Chatbot Project

## Project Overview

This is the **IPN (Inspired Pet Nutrition) Documentation Chatbot** - a full-stack web application that provides an intelligent documentation explorer and AI-powered chatbot assistant for the IPN codebase. The project combines a React-based documentation viewer with a RAG (Retrieval-Augmented Generation) chatbot backend.

### Key Features

- **Documentation Explorer**: Browse 4,500+ auto-generated documentation files organized by category (Backend, Frontend, CMS)
- **AI Chatbot (SIA - Smart IPN Assistant)**: RAG-powered chatbot that answers technical questions about the codebase
- **Authentication**: Firebase-based authentication system for protected routes
- **File Categorization**: Automatic categorization of PHP (backend), JavaScript/TypeScript/Vue (frontend), and other files
- **Full-text Search**: Search across all documentation files with category filtering
- **Vector Store**: FAISS-based semantic search for intelligent document retrieval

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 + TypeScript
- **Build Tool**: Vite 6.3.5
- **Routing**: React Router DOM 7.13.0
- **Styling**: Tailwind CSS 4.1.12 + shadcn/ui components
- **UI Components**: Radix UI primitives, Material UI, Lucide icons
- **Animation**: Framer Motion (motion/react)
- **Authentication**: Firebase Auth

### Backend (RAG System)
- **Framework**: Flask 3.0.3 (Python)
- **Vector Store**: FAISS (Facebook AI Similarity Search) + Sentence Transformers
- **LLM**: Groq API (Llama 3.1 8B Instant)
- **Embeddings**: all-MiniLM-L6-v2 model
- **Document Processing**: LangChain + custom document processor
- **CORS**: Enabled for development

### Infrastructure
- **Package Manager**: npm (with pnpm overrides for Vite)
- **Node Version**: ES Modules (type: "module")
- **Deployment**: Vercel (configured via vercel.json)

## Project Structure

```
IPN_FINAL/
├── src/                          # Frontend React application
│   ├── app/                      # App-specific components
│   │   ├── components/           # UI components (shadcn/ui)
│   │   ├── data/                 # Mock data
│   │   └── types/                # TypeScript types
│   ├── components/               # Main components
│   │   ├── Chatbot.tsx           # AI chatbot component
│   │   ├── Navigation.tsx        # Navigation bar
│   │   ├── Footer.tsx            # Footer component
│   │   └── ProtectedRoute.tsx    # Auth route guard
│   ├── config/                   # Configuration files
│   │   └── firebase.ts           # Firebase configuration
│   ├── contexts/                 # React contexts
│   │   └── AuthContext.tsx       # Authentication context
│   ├── data/                     # Generated data
│   │   └── documentation.json    # Auto-generated from SUMMARY.md
│   ├── hooks/                    # Custom React hooks
│   ├── pages/                    # Route pages
│   │   ├── Home.tsx              # Landing page
│   │   ├── Documentation.tsx     # Documentation viewer
│   │   ├── Explore.tsx           # Explore page
│   │   ├── Overview.tsx          # Overview page
│   │   ├── Login.tsx             # Authentication page
│   │   └── AdminPanel.tsx        # Admin dashboard
│   ├── services/                 # API services
│   ├── styles/                   # Global styles
│   ├── types/                    # TypeScript definitions
│   │   └── documentation.ts      # Documentation types
│   ├── App.tsx                   # Main App component
│   ├── main.tsx                  # Entry point
│   └── router.tsx                # Route definitions
├── RAG/                          # Python RAG backend
│   ├── src/                      # RAG source code
│   │   ├── __init__.py
│   │   ├── rag_engine.py         # Core RAG logic
│   │   ├── vectorstore.py        # FAISS vector store
│   │   ├── document_processor.py # Document loading
│   │   ├── embedding.py          # Embedding utilities
│   │   ├── search.py             # Search utilities
│   │   └── data_loader.py        # Data loading
│   ├── faiss_store/              # Persisted vector store
│   │   ├── faiss.index
│   │   └── metadata.pkl
│   ├── app.py                    # Flask API entry point
│   ├── requirements.txt          # Python dependencies
│   ├── setup.py                  # Setup script
│   ├── test_rag.py               # RAG tests
│   └── venv/                     # Python virtual environment
├── scripts/                      # Build/utility scripts
│   ├── generateDocsData.js       # Parse SUMMARY.md to JSON
│   ├── generate_docs.py          # Python doc generator
│   └── validate_docs.py          # Documentation validator
├── public/                       # Static assets
│   ├── docs/                     # Markdown documentation files (4,500+)
│   └── data/                     # Public data files
├── SUMMARY.md                    # Documentation index
├── package.json                  # npm configuration
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
└── vercel.json                   # Vercel deployment config
```

## Build and Development Commands

### Frontend (npm scripts)

```bash
# Install dependencies
npm install

# Generate documentation.json from SUMMARY.md and start dev server
npm run dev

# Build for production
npm run build

# Generate documentation JSON only
npm run generate-docs
```

### RAG Backend (Python)

```bash
# Navigate to RAG directory
cd RAG

# Setup (Windows)
./run_windows.ps1

# Or manually:
# 1. Create virtual environment
python -m venv venv

# 2. Activate (Windows)
venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the Flask server
python app.py
```

The RAG server runs on port 5000 by default.

## Development Workflow

### Prerequisites

1. Node.js (for frontend)
2. Python 3.8+ (for RAG backend)
3. Groq API key (set in `RAG/.env`)
4. Firebase project configuration (set in root `.env`)

### Environment Variables

**Root `.env` (Frontend)**:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_measurementId=
GROQ_API_KEY=
```

**RAG/.env (Backend)**:
```
GROQ_API_KEY=your_groq_api_key_here
SIMILARITY_THRESHOLD=0.35
MAX_HISTORY_MESSAGES=10
TOP_K_RETRIEVAL=5
PORT=5000
FLASK_DEBUG=false
```

### Starting Development

1. **Start the RAG backend**:
   ```bash
   cd RAG
   python app.py
   ```

2. **Start the frontend** (in a new terminal):
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - RAG API: http://localhost:5000

### API Endpoints (RAG Backend)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with system stats |
| `/api/chat` | POST | Main chat endpoint with RAG |
| `/api/query` | POST | Legacy query endpoint |
| `/api/search` | POST | Direct document search |
| `/api/stats` | GET | System statistics |
| `/api/rebuild-index` | POST | Rebuild vector store (admin) |

### Request/Response Format

**Chat Request**:
```json
{
  "message": "How does the subscription system work?",
  "chat_history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

**Chat Response**:
```json
{
  "response": "The subscription system...",
  "sources": [
    {
      "file": "Subscription.php",
      "path": "src/Entity/Subscription/Subscription.php",
      "category": "backend",
      "relevance_score": 0.85
    }
  ],
  "metadata": {
    "retrieved_chunks": 5,
    "used_context": true,
    "processing_time_ms": 1200
  }
}
```

## Code Style Guidelines

### Frontend (TypeScript/React)

- **Components**: Functional components with hooks
- **Imports**: Use `@/` alias for src directory
- **Types**: Explicit TypeScript interfaces in `src/types/`
- **Styling**: Tailwind CSS utility classes
- **UI Components**: shadcn/ui pattern with Radix primitives
- **Naming**: PascalCase for components, camelCase for functions/variables

### RAG Backend (Python)

- **Style**: PEP 8 compliant
- **Type Hints**: Use type annotations for all functions
- **Documentation**: Docstrings for classes and methods
- **Logging**: Use Python logging module with appropriate levels
- **Error Handling**: Try-except blocks with meaningful error messages

## Testing

### Frontend

- Vitest for unit testing (configured in package.json)
- Component stories in Storybook (referenced in docs)

### RAG Backend

```bash
cd RAG
python test_rag.py
```

## Documentation Generation

The project uses a custom documentation generation system:

1. **Source**: `SUMMARY.md` contains the documentation index
2. **Generator**: `scripts/generateDocsData.js` parses SUMMARY.md
3. **Output**: `src/data/documentation.json` and `public/data/documentation.json`
4. **Categories**:
   - Backend: `.php` files (Symfony, API Platform)
   - Frontend: `.js`, `.ts`, `.vue` files (Nuxt, Vue.js)
   - Other: YAML, XML, JSON configuration files

### Adding New Documentation

1. Add markdown files to `public/docs/`
2. Update `SUMMARY.md` with new entries
3. Run `npm run generate-docs`

## Security Considerations

1. **Authentication**: Firebase Auth with protected routes
2. **API Keys**: Never commit `.env` files (already in `.gitignore`)
3. **CORS**: Configured for specific origins in production
4. **Rate Limiting**: 30 requests per minute per IP on RAG endpoints
5. **Admin Endpoints**: Protected by `X-Admin-Key` header

## Deployment

### Vercel (Frontend)

Configured via `vercel.json`:
- SPA routing support
- All routes redirect to `index.html`

### RAG Backend

Can be deployed to:
- Heroku
- Railway
- AWS/GCP/Azure
- Any Python-compatible hosting

Requirements:
- Environment variables set
- FAISS index built (or built on first run)
- Port configurable via `PORT` env var

## Troubleshooting

### Common Issues

1. **RAG backend not responding**:
   - Check if Python server is running on port 5000
   - Verify Groq API key is set in `RAG/.env`

2. **Documentation not loading**:
   - Run `npm run generate-docs` to rebuild `documentation.json`
   - Check `public/docs/` folder exists with markdown files

3. **Build errors**:
   - Ensure Node.js version supports ES modules
   - Clear `node_modules` and reinstall

4. **Vector store issues**:
   - Delete `RAG/faiss_store/` to force rebuild
   - Check documents exist in `public/docs/`

### Logs

- Frontend: Browser console
- RAG: Terminal output with structured logging
- Flask: Standard Werkzeug logs

## Architecture Notes

### Data Flow

1. User query → Chatbot component
2. POST to `/api/chat` → RAG backend
3. Query expansion → FAISS vector search
4. Retrieve top-k chunks → Re-rank
5. Format context → LLM (Groq)
6. Stream/generate response → Frontend
7. Display with source attribution

### Key Design Decisions

- **Hybrid Search**: FAISS for semantic + custom re-ranking for diversity
- **Query Expansion**: Synonym expansion for technical terms
- **Casual Query Detection**: Regex patterns for greetings/FAQ
- **Source Attribution**: All responses include relevant file references
- **Streaming Support**: Server-sent events for real-time responses

## License

Private project - Inspired Pet Nutrition
