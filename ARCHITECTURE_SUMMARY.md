# IPN Documentation Chatbot - Architecture Summary

## Overview

The **IPN (Inspired Pet Nutrition) Documentation Chatbot** is a full-stack RAG (Retrieval-Augmented Generation) application that provides an AI-powered assistant named **SIA (Smart IPN Assistant)**. The system enables developers and team members to explore 4,500+ auto-generated documentation files and ask technical questions about the IPN codebase.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     React Frontend (Port 5173)                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │ │
│  │  │  Chatbot UI  │  │Documentation │  │      Search & Browse         │  │ │
│  │  │  (Floating   │  │   Viewer     │  │       (Overview Page)        │  │ │
│  │  │   Widget)    │  │              │  │                              │  │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────────┬───────────────┘  │ │
│  │         │                 │                         │                  │ │
│  │         └─────────────────┴─────────────────────────┘                  │ │
│  │                           │                                            │ │
│  │              ┌────────────▼────────────┐                               │ │
│  │              │   React Router + Auth   │                               │ │
│  │              │   (Protected Routes)    │                               │ │
│  │              └────────────┬────────────┘                               │ │
│  └───────────────────────────┼────────────────────────────────────────────┘ │
│                              │                                               │
│                              ▼ HTTP/REST API                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                          RAG BACKEND LAYER (Python)                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Flask API Server (Port 5000)                        │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    API Endpoints                                │   │ │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │   │ │
│  │  │  │ POST /api/  │ │ POST /api/  │ │POST /api/   │ │ GET /api/ │ │   │ │
│  │  │  │    chat     │ │   query     │ │   search    │ │   stats   │ │   │ │
│  │  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ │   │ │
│  │  │         │               │               │              │       │   │ │
│  │  │         └───────────────┴───────┬───────┴──────────────┘       │   │ │
│  │  │                                 ▼                              │   │ │
│  │  │              ┌──────────────────────────────────┐              │   │ │
│  │  │              │      RAG Engine Core             │              │   │ │
│  │  │              │  ┌────────────────────────────┐  │              │   │ │
│  │  │              │  │    Query Processing        │  │              │   │ │
│  │  │              │  │  ┌──────────────────────┐  │  │              │   │ │
│  │  │              │  │  │  Query Expansion     │  │  │              │   │ │
│  │  │              │  │  │  (Synonym mapping)   │  │  │              │   │ │
│  │  │              │  │  └──────────┬───────────┘  │  │              │   │ │
│  │  │              │  │             ▼              │  │              │   │ │
│  │  │              │  │  ┌──────────────────────┐  │  │              │   │ │
│  │  │              │  │  │   Casual Query       │  │  │              │   │ │
│  │  │              │  │  │   Detection          │  │  │              │   │ │
│  │  │              │  │  │  (Regex patterns)    │  │  │              │   │ │
│  │  │              │  │  └──────────┬───────────┘  │  │              │   │ │
│  │  │              │  │             ▼              │  │              │   │ │
│  │  │              │  │  ┌──────────────────────┐  │  │              │   │ │
│  │  │              │  │  │   Semantic Search    │  │  │              │   │ │
│  │  │              │  │  │   (FAISS + Embeds)   │  │  │              │   │ │
│  │  │              │  │  └──────────┬───────────┘  │  │              │   │ │
│  │  │              │  │             ▼              │  │              │   │ │
│  │  │              │  │  ┌──────────────────────┐  │  │              │   │ │
│  │  │              │  │  │   Re-ranking         │  │  │              │   │ │
│  │  │              │  │  │  (Category diversity)│  │  │              │   │ │
│  │  │              │  │  └──────────┬───────────┘  │  │              │   │ │
│  │  │              │  │             ▼              │  │              │   │ │
│  │  │              │  │  ┌──────────────────────┐  │  │              │   │ │
│  │  │              │  │  │   Context Formatting │  │  │              │   │ │
│  │  │              │  │  └──────────┬───────────┘  │  │              │   │ │
│  │  │              │  │             ▼              │  │              │   │ │
│  │  │              │  │  ┌──────────────────────┐  │  │              │   │ │
│  │  │              │  │  │   LLM Generation     │  │  │              │   │ │
│  │  │              │  │  │  (Groq/Llama 3.1)    │  │  │              │   │ │
│  │  │              │  │  └──────────────────────┘  │  │              │   │ │
│  │  │              │  └────────────────────────────┘  │              │   │ │
│  │  │              └──────────────────────────────────┘              │   │ │
│  │  │                              │                                 │   │ │
│  │  │         ┌────────────────────┼────────────────────┐            │   │ │
│  │  │         ▼                    ▼                    ▼            │   │ │
│  │  │  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐    │   │ │
│  │  │  │   FAISS     │      │ Document    │      │   Groq      │    │   │ │
│  │  │  │ VectorStore │      │ Processor   │      │   LLM       │    │   │ │
│  │  │  │             │      │             │      │             │    │   │ │
│  │  │  │ • Cosine    │      │ • File      │      │ • Llama 3.1 │    │   │ │
│  │  │  │   similarity│      │   loading   │      │ • 8B params │    │   │ │
│  │  │  │ • Metadata  │      │ • Chunking  │      │ • 2048 tok  │    │   │ │
│  │  │  │ • Persisted │      │ • Category  │      │ • Streaming │    │   │ │
│  │  │  └─────────────┘      └─────────────┘      └─────────────┘    │   │ │
│  │  │                                                                 │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │
│  │   public/docs/      │    │   faiss_store/      │    │   SUMMARY.md    │  │
│  │                     │    │                     │    │                 │  │
│  │  4,500+ markdown    │    │  • faiss.index      │    │  Documentation  │  │
│  │  files organized    │    │  • metadata.pkl     │    │  index file     │  │
│  │  by category        │    │                     │    │                 │  │
│  │                     │    │  Pre-computed       │    │  Generates      │  │
│  │  Backend/           │    │  embeddings for     │    │  navigation     │  │
│  │  ├── API/           │    │  fast retrieval     │    │  structure      │  │
│  │  ├── Entities/      │    │                     │    │                 │  │
│  │  └── Services/      │    │                     │    │                 │  │
│  │                     │    │                     │    │                 │  │
│  │  Frontend/          │    │                     │    │                 │  │
│  │  ├── Components/    │    │                     │    │                 │  │
│  │  ├── Composables/   │    │                     │    │                 │  │
│  │  └── Stores/        │    │                     │    │                 │  │
│  │                     │    │                     │    │                 │  │
│  │  CMS/               │    │                     │    │                 │  │
│  │  └── Strapi/        │    │                     │    │                 │  │
│  │                     │    │                     │    │                 │  │
│  └─────────────────────┘    └─────────────────────┘    └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Frontend Layer (React + TypeScript)

#### Chatbot Component (`src/components/Chatbot.tsx`)
- **Floating Action Button (FAB)**: Toggles the chat interface
- **Chat Window**: Messages display with markdown formatting
- **Source Badges**: Expandable cards showing which files were referenced
- **Quick Suggestions**: Pre-defined common questions
- **Connection Status**: Real-time backend health monitoring
- **Features**:
  - Auto-scroll to new messages
  - Typing indicators
  - Error handling with retry
  - Markdown rendering (bold, code blocks, lists)

#### Documentation Viewer (`src/pages/Documentation.tsx`)
- Browse 4,500+ documentation files
- Category filtering (Backend, Frontend, CMS)
- Full-text search
- Syntax highlighting for code blocks

#### Authentication (`src/contexts/AuthContext.tsx`)
- Firebase Auth integration
- Protected routes for admin features
- Login/Logout flow

---

### 2. Backend Layer (Flask + Python)

#### API Endpoints (`RAG/app.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with system stats |
| `/api/chat` | POST | Main RAG chat endpoint |
| `/api/query` | POST | Legacy query endpoint |
| `/api/search` | POST | Direct document search (no LLM) |
| `/api/stats` | GET | System statistics |
| `/api/rebuild-index` | POST | Rebuild vector store (admin) |

**Security Features:**
- Rate limiting: 30 requests/minute per IP
- CORS configured for specific origins
- Admin API key protection for rebuild endpoint

#### RAG Engine (`RAG/src/rag_engine.py`)

**Core Pipeline:**

1. **Query Processing**
   ```
   User Query → Query Expansion → Casual Detection → Semantic Search
   ```

2. **Query Expansion**
   - Maps technical terms to synonyms
   - Example: `auth` → `authentication login token jwt security`
   - Improves retrieval for technical terminology

3. **Casual Query Detection**
   - Regex patterns detect greetings, thanks, small talk
   - Bypasses RAG for predefined responses
   - Examples: "hi", "hello", "thanks", "how are you"

4. **Semantic Search**
   - Uses FAISS for fast similarity search
   - Retrieves top-k chunks (default: 5)
   - Applies similarity threshold (default: 0.35)

5. **Re-ranking**
   - Groups chunks by category (backend/frontend/other)
   - Interleaves results for diversity
   - Ensures balanced representation from each category

6. **Context Formatting**
   - Formats chunks with source attribution
   - Includes file path, category, relevance score

7. **LLM Generation**
   - Model: **Llama 3.1 8B Instant** via Groq API
   - Temperature: 0.3 (focused, deterministic)
   - Max tokens: 2048
   - System prompt optimized for IPN documentation

#### Vector Store (`RAG/src/vectorstore.py`)

**FAISS (Facebook AI Similarity Search):**
- **Embedding Model**: `all-MiniLM-L6-v2` (384 dimensions)
- **Similarity Metric**: Cosine similarity via L2 normalization + IndexFlatIP
- **Persistence**: Index saved to `faiss.index`, metadata to `metadata.pkl`
- **Features**:
  - Batch encoding for efficiency
  - Category filtering support
  - Metadata-rich retrieval

#### Document Processor (`RAG/src/document_processor.py`)

**File Categorization:**
```python
Backend:  .php, .xml, .yaml, .yml, .twig
Frontend: .vue, .js, .ts, .tsx, .jsx, .json
Other:    .md, .css, .scss, .sh, .sql
```

**Chunking Strategy:**
- Max chunk size: 2000 characters
- Overlap: 200 characters
- Preserves headers and code blocks
- Header-based splitting for structure

---

### 3. Data Layer

#### Documentation Files (`public/docs/`)
- **4,500+ markdown files** auto-generated from IPN codebase
- Organized hierarchically by category
- Filename format: `original_filename_ext.md`
- Content includes code, comments, and structure

#### Vector Store (`RAG/faiss_store/`)
- `faiss.index`: Binary FAISS index
- `metadata.pkl`: Pickled metadata including full text
- Enables sub-second semantic search

#### SUMMARY.md
- Master index of all documentation
- Used to generate navigation structure
- Processed by `scripts/generateDocsData.js`

---

## Request Flow

### Chat Request Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────────┐
│  User    │────▶│  React UI    │────▶│  Flask API       │
│  Input   │     │  Chatbot.tsx │     │  /api/chat       │
└──────────┘     └──────────────┘     └────────┬─────────┘
                                                │
                                                ▼
                              ┌───────────────────────────────────┐
                              │  RAG Engine                       │
                              │  1. Expand query with synonyms    │
                              │  2. Check for casual queries      │
                              │  3. Retrieve chunks from FAISS    │
                              │  4. Re-rank by category diversity │
                              │  5. Format context with sources   │
                              │  6. Send to Groq LLM              │
                              └────────┬──────────────────────────┘
                                       │
                                       ▼
                              ┌───────────────────────────────────┐
                              │  Groq API                         │
                              │  Llama 3.1 8B Instant             │
                              │  Generate response                │
                              └────────┬──────────────────────────┘
                                       │
                                       ▼
                              ┌───────────────────────────────────┐
                              │  Response with sources            │
                              │  Return to Frontend               │
                              └───────────────────────────────────┘
```

### Example API Request/Response

**Request:**
```json
POST /api/chat
{
  "message": "How does the subscription system work?",
  "chat_history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

**Response:**
```json
{
  "response": "The subscription system uses the Subscription entity...",
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

---

## Key Design Decisions

### 1. **Hybrid Search Approach**
- FAISS for fast semantic retrieval
- Custom re-ranking for category diversity
- Ensures balanced representation across backend/frontend

### 2. **Query Expansion**
- Technical domain synonyms improve recall
- Prevents missing relevant docs due to terminology differences

### 3. **Casual Query Detection**
- Fast-path for greetings/FAQ
- Reduces unnecessary LLM calls
- Predefined responses for common interactions

### 4. **Source Attribution**
- Every response includes file references
- Users can verify information
- Builds trust in AI responses

### 5. **Streaming Support**
- Real-time token generation
- Better UX for long responses
- Server-sent events (SSE)

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI framework |
| **Styling** | Tailwind CSS + shadcn/ui | Component styling |
| **Build** | Vite 6 | Fast development/build |
| **Backend** | Flask 3 | API server |
| **Vector DB** | FAISS | Semantic search |
| **Embeddings** | all-MiniLM-L6-v2 | Text vectorization |
| **LLM** | Groq API + Llama 3.1 8B | Response generation |
| **Auth** | Firebase | User authentication |

---

## Deployment

### Frontend (Vercel)
- Static site generation
- SPA routing configured
- Environment variables for Firebase

### Backend (Python Server)
- Flask app on port 5000
- Requires `GROQ_API_KEY` environment variable
- Vector store auto-builds on first run

---

## Performance Metrics

- **Document Count**: 4,500+ files
- **Indexed Chunks**: ~15,000+
- **Retrieval Time**: <100ms
- **LLM Response Time**: 1-3 seconds
- **Total API Response**: 1.5-4 seconds

---

## Security Considerations

1. **API Keys**: Stored in `.env`, never committed
2. **Rate Limiting**: 30 req/min per IP
3. **CORS**: Configured for specific origins
4. **Admin Endpoints**: Protected by API key
5. **Input Validation**: All user inputs sanitized
