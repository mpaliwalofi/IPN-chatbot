"""
IPN RAG Chatbot Backend - Production-Ready API
Provides intelligent document retrieval and conversational AI capabilities
"""

import os
import re
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
from functools import wraps
import time

from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / '.env', override=True)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000", "*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Import RAG components
from src.vectorstore import FaissVectorStore
from src.rag_engine import RAGEngine, ChatMessage

# Configuration
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY not found in .env file!")
    raise ValueError("GROQ_API_KEY is required. Please set it in RAG/.env file")

logger.info(f"Groq API Key loaded: {GROQ_API_KEY[:20]}...")

# Constants
DOCS_PATH = Path(__file__).resolve().parent.parent / "public" / "docs"
VECTOR_STORE_PATH = BASE_DIR / "faiss_store"
SIMILARITY_THRESHOLD = float(os.getenv('SIMILARITY_THRESHOLD', '0.35'))
MAX_HISTORY_MESSAGES = int(os.getenv('MAX_HISTORY_MESSAGES', '10'))
TOP_K_RETRIEVAL = int(os.getenv('TOP_K_RETRIEVAL', '5'))

# Initialize RAG Engine
logger.info("Initializing RAG Engine...")
rag_engine = RAGEngine(
    persist_dir=str(VECTOR_STORE_PATH),
    groq_api_key=GROQ_API_KEY,
    docs_path=str(DOCS_PATH),
    similarity_threshold=SIMILARITY_THRESHOLD
)

# Ensure vector store is ready
if not rag_engine.is_ready():
    logger.info("Building vector store from documents...")
    rag_engine.build_vector_store()
else:
    logger.info("Vector store loaded successfully")

# Rate limiting storage
request_history: Dict[str, List[float]] = {}
RATE_LIMIT_REQUESTS = 30  # requests per minute
RATE_LIMIT_WINDOW = 60  # seconds


def rate_limit(func):
    """Simple rate limiting decorator"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        client_ip = request.remote_addr or 'unknown'
        current_time = time.time()
        
        # Clean old entries
        if client_ip in request_history:
            request_history[client_ip] = [
                t for t in request_history[client_ip] 
                if current_time - t < RATE_LIMIT_WINDOW
            ]
        else:
            request_history[client_ip] = []
        
        # Check rate limit
        if len(request_history.get(client_ip, [])) >= RATE_LIMIT_REQUESTS:
            return jsonify({
                'error': 'Rate limit exceeded',
                'message': 'Too many requests. Please try again in a minute.'
            }), 429
        
        request_history[client_ip].append(current_time)
        return func(*args, **kwargs)
    return wrapper


def is_casual_query(query: str) -> bool:
    """Detect if query is casual conversation (greetings, thanks, etc.)"""
    casual_patterns = [
        r'^(hi+|hey+|hello+|howdy|hiya)[!?.\s]*$',
        r'^how are (you|u)[\s?!.]*$',
        r'^(good\s)?(morning|evening|afternoon|night)[!?.\s]*$',
        r'^(thanks?|thank you|thx|ty)[!?.\s]*$',
        r'^(bye|goodbye|see you|later|cya)[!?.\s]*$',
        r'^(ok|okay|sure|got it|alright|cool|great|nice)[!?.\s]*$',
        r'^what\s*('|
        r's)?\s*(your name|up)[?!.]*$',
        r'^who are you[?!.]*$',
        r'^(awesome|wow|interesting)[!?.\s]*$',
        r'^help[\s?!.]*$',
        r'^what can you do[\s?!.]*$',
    ]
    q = query.strip().lower()
    return any(re.match(p, q) for p in casual_patterns)


# ============================================================================
# API Routes
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'components': {
            'vector_store': rag_engine.is_ready(),
            'llm': True,
            'documents_indexed': rag_engine.get_document_count()
        }
    })


@app.route('/api/chat', methods=['POST'])
@rate_limit
def chat():
    """
    Main chat endpoint - handles user queries with RAG
    
    Request body:
    {
        "message": "user query string",
        "chat_history": [{"role": "user|assistant", "content": "message"}],
        "stream": false (optional)
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        user_message = data.get('message', '').strip()
        chat_history = data.get('chat_history', [])
        stream = data.get('stream', False)
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Validate chat history
        if not isinstance(chat_history, list):
            chat_history = []
        
        # Convert history to ChatMessage objects
        messages = []
        for msg in chat_history[-MAX_HISTORY_MESSAGES:]:
            if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
                messages.append(ChatMessage(
                    role=msg['role'],
                    content=msg['content']
                ))
        
        logger.info(f"Chat query: '{user_message[:100]}...' | History: {len(messages)} messages")
        
        # Handle streaming response
        if stream:
            def generate():
                try:
                    for chunk in rag_engine.stream_response(user_message, messages):
                        yield f"data: {chunk}\n\n"
                    yield "data: [DONE]\n\n"
                except Exception as e:
                    logger.error(f"Streaming error: {e}")
                    yield f"data: {{'error': '{str(e)}'}}\n\n"
            
            return Response(
                stream_with_context(generate()),
                mimetype='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no'
                }
            )
        
        # Non-streaming response
        result = rag_engine.generate_response(user_message, messages, validate_output=True)
        
        # Format sources for frontend
        sources = []
        for source in result.get('sources', []):
            sources.append({
                'file': source.get('file', 'Unknown'),
                'path': source.get('path', ''),
                'category': source.get('category', 'other'),
                'relevance_score': round(source.get('score', 0), 3)
            })
        
        # Build metadata - only include validation for non-casual responses
        metadata = {
            'retrieved_chunks': result.get('retrieved_chunks', 0),
            'used_context': result.get('used_context', False),
            'is_casual': result.get('is_casual', False),
            'is_overview': result.get('is_overview', False),
            'processing_time_ms': result.get('processing_time_ms', 0)
        }
        
        # Only add validation metrics for non-casual responses
        if not result.get('is_casual', False) and 'validation_metrics' in result:
            metadata['validation'] = result['validation_metrics']
            vm = result['validation_metrics']
            quality = vm.get('overall_quality', 0)
            logger.info(f"Response quality: {quality:.2f} | Faithfulness: {vm.get('faithfulness', 0):.2f}")
        
        response_data = {
            'response': result['response'],
            'sources': sources,
            'metadata': metadata
        }
        
        logger.info(f"Response generated | Sources: {len(sources)} | Context used: {result.get('used_context', False)} | Casual: {result.get('is_casual', False)}")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/query', methods=['POST'])
@rate_limit
def query():
    """
    Legacy query endpoint - simplified RAG response
    Maintains backward compatibility
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        user_message = data.get('query', data.get('message', '')).strip()
        chat_history = data.get('chat_history', [])
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Convert history
        messages = []
        for msg in chat_history[-6:]:
            if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
                messages.append(ChatMessage(
                    role=msg['role'],
                    content=msg['content']
                ))
        
        result = rag_engine.generate_response(user_message, messages)
        
        return jsonify({
            'response': result['response'],
            'sources': result.get('sources', [])
        })
        
    except Exception as e:
        logger.error(f"Query endpoint error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/search', methods=['POST'])
@rate_limit
def search_documents():
    """
    Direct document search endpoint - returns matching chunks without LLM processing
    
    Request body:
    {
        "query": "search string",
        "top_k": 5 (optional)
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({'error': 'No query provided'}), 400
        
        query_text = data['query'].strip()
        top_k = min(data.get('top_k', 5), 20)  # Max 20 results
        
        results = rag_engine.search_documents(query_text, top_k=top_k)
        
        return jsonify({
            'query': query_text,
            'results': results,
            'count': len(results)
        })
        
    except Exception as e:
        logger.error(f"Search endpoint error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get system statistics"""
    try:
        stats = rag_engine.get_stats()
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Stats endpoint error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/rebuild-index', methods=['POST'])
def rebuild_index():
    """Rebuild the vector store index (admin endpoint)"""
    try:
        # Optional: Add authentication check here
        api_key = request.headers.get('X-Admin-Key')
        expected_key = os.getenv('ADMIN_API_KEY')
        
        if expected_key and api_key != expected_key:
            return jsonify({'error': 'Unauthorized'}), 401
        
        logger.info("Rebuilding vector store index...")
        rag_engine.build_vector_store(force_rebuild=True)
        
        return jsonify({
            'success': True,
            'message': 'Vector store rebuilt successfully',
            'document_count': rag_engine.get_document_count()
        })
        
    except Exception as e:
        logger.error(f"Rebuild index error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/validate', methods=['POST'])
@rate_limit
def validate_response():
    """
    Validate a response for quality metrics
    
    Request body:
    {
        "query": "original query",
        "response": "response to validate",
        "context": "retrieved context (optional)"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        query = data.get('query', '').strip()
        response_text = data.get('response', '').strip()
        context = data.get('context', '')
        
        if not query or not response_text:
            return jsonify({'error': 'Query and response are required'}), 400
        
        # Run validation
        from src.output_validator import OutputValidator
        validator = OutputValidator()
        
        metrics = validator.validate(
            query=query,
            response=response_text,
            context=context,
            sources=[]
        )
        
        return jsonify({
            'metrics': metrics.to_dict(),
            'is_valid': metrics.is_valid(),
            'assessment': 'high_quality' if metrics.overall_score() > 0.8 else 
                         'acceptable' if metrics.is_valid() else 'needs_improvement'
        })
        
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/overview', methods=['GET'])
def get_overview():
    """Get IPN codebase overview and statistics"""
    try:
        stats = rag_engine.doc_analyzer.analyze()
        
        return jsonify({
            'codebase': {
                'total_documents': stats.total_documents,
                'backend_files': stats.backend_files,
                'frontend_files': stats.frontend_files,
                'other_files': stats.other_files,
            },
            'architecture': {
                'controllers': {
                    'count': stats.total_controllers,
                    'sample': stats.controllers[:10]
                },
                'entities': {
                    'count': stats.total_entities,
                    'sample': stats.entities[:10]
                },
                'services': {
                    'count': stats.total_services,
                    'sample': stats.services[:10]
                },
                'repositories': stats.total_repositories,
                'components': stats.total_components,
                'composables': stats.total_composables
            },
            'description': {
                'short': 'IPN is a pet nutrition e-commerce platform built with Symfony and Vue.js',
                'tech_stack': {
                    'backend': 'PHP/Symfony/API Platform',
                    'frontend': 'Vue.js/Nuxt/TypeScript',
                    'cms': 'Strapi'
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Overview error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == "__main__":
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Starting IPN RAG API server on port {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Document path: {DOCS_PATH}")
    logger.info(f"Vector store path: {VECTOR_STORE_PATH}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
