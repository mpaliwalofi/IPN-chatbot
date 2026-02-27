"""
RAG Engine - Core Retrieval-Augmented Generation Logic
Provides intelligent document retrieval and response generation
"""

import os
import re
import time
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Iterator, Tuple
from dataclasses import dataclass
from datetime import datetime

import numpy as np
from langchain_groq import ChatGroq
try:
    from langchain.schema import HumanMessage, SystemMessage, AIMessage
except ImportError:
    from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from src.vectorstore import FaissVectorStore
from src.document_processor import DocumentProcessor
from src.document_analyzer import DocumentAnalyzer
from src.output_validator import OutputValidator, ValidationMetrics

logger = logging.getLogger(__name__)


@dataclass
class ChatMessage:
    """Represents a chat message"""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


@dataclass
class RetrievedChunk:
    """Represents a retrieved document chunk"""
    text: str
    source_file: str
    file_path: str
    category: str
    relevance_score: float
    chunk_index: int


class RAGEngine:
    """
    Production-ready RAG Engine for IPN Documentation
    
    Features:
    - Semantic search with FAISS
    - Query expansion for better retrieval
    - Re-ranking of retrieved chunks
    - Source attribution
    - Streaming response support
    """
    
    def __init__(
        self,
        persist_dir: str,
        groq_api_key: str,
        docs_path: str,
        embedding_model: str = "all-MiniLM-L6-v2",
        llm_model: str = "llama-3.1-8b-instant",
        similarity_threshold: float = 0.35,
        chunk_size: int = 800,
        chunk_overlap: int = 200
    ):
        self.persist_dir = persist_dir
        self.docs_path = docs_path
        self.similarity_threshold = similarity_threshold
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Initialize vector store
        self.vector_store = FaissVectorStore(
            persist_dir=persist_dir,
            embedding_model=embedding_model,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        
        # Initialize LLM
        self.llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name=llm_model,
            temperature=0.3,
            max_tokens=2048
        )
        
        # Initialize document processor
        self.doc_processor = DocumentProcessor()
        
        # Initialize document analyzer for overview questions
        self.doc_analyzer = DocumentAnalyzer(docs_path)
        
        # Initialize output validator
        self.output_validator = OutputValidator(embedding_model)
        
        # System prompt optimized for IPN documentation
        self.system_prompt = """You are SIA (Smart IPN Assistant), an expert technical documentation assistant for IPN (Inspired Pet Nutrition).

YOUR ROLE:
- Help developers and team members understand the IPN codebase, APIs, and architecture
- Answer questions about PHP/Symfony backend, Vue.js/Nuxt frontend, and Strapi CMS
- Provide accurate, concise technical information based on the documentation

CRITICAL RULES:
1. NEVER say "based on the context", "according to the documentation", or similar phrases - just answer naturally
2. If the provided context contains the answer, use it precisely but phrase it conversationally
3. If the context doesn't contain the answer but it's general programming knowledge, answer from your expertise
4. If you truly don't know something specific to IPN's internal systems, say so honestly
5. Keep responses concise but complete - prioritize accuracy over length
6. For code questions, include relevant code snippets when available in the context
7. Always cite file names naturally when referring to specific implementations

CONVERSATION STYLE:
- Be friendly and professional
- For greetings (hi, hello, thanks), respond warmly and briefly
- For technical questions, be precise and structured
- Use markdown formatting for code, lists, and emphasis when helpful

Remember: You represent IPN's technical team. Be helpful, accurate, and professional."""

        # Casual conversation responses - NO validation scores for these
        self.casual_responses = {
            # Greetings
            r'^(hi+|hey+|hello+|yo|hiya)': "Hello! 👋 I'm SIA, your IPN documentation assistant. How can I help you today?",
            r'^how are (you|u)': "I'm doing great, thanks for asking! Ready to help you navigate the IPN documentation. What would you like to know?",
            r'^(good\s)?morning': "Good morning! ☀️ Ready to help with any IPN documentation questions.",
            r'^(good\s)?afternoon': "Good afternoon! Ready to help with any IPN documentation questions.",
            r'^(good\s)?evening': "Good evening! 🌙 Ready to help with any IPN documentation questions.",
            r'^(good\s)?night': "Good night! Feel free to return anytime you need help with IPN docs.",
            
            # Thanks
            r'^(thanks?|thank you|thx|ty|appreciate)': "You're welcome! 😊 Happy to help. Let me know if you have more questions!",
            
            # Goodbyes
            r'^(bye|goodbye|see you|later|cya|take care)': "Goodbye! Feel free to come back anytime you need help with IPN docs! 👋",
            
            # Acknowledgments
            r'^(ok|okay|sure|got it|alright|cool|great|nice|awesome|wow|perfect)': "😊",
            
            # Help requests
            r'^help': "I can help you with:\n\n• **Backend (PHP/Symfony)**: API endpoints, entities, services\n• **Frontend (Vue.js/Nuxt)**: Components, composables, stores\n• **CMS (Strapi)**: Content models, configurations\n• **General**: Architecture, data flow, best practices\n\nWhat would you like to explore?",
            r'^(can|could) you help': "I'd be happy to help! What do you need assistance with regarding the IPN codebase?",
            r'^please help': "Of course! What would you like help with?",
            
            # Identity questions
            r'^who are you': "I'm **SIA** (Smart IPN Assistant)! 🤖\n\nI have access to 4,500+ documentation files covering:\n• Backend PHP/Symfony API Platform\n• Frontend Vue.js/Nuxt e-commerce\n• Strapi CMS configuration\n\nI can answer technical questions, find code examples, and help you understand the IPN architecture.",
            r"^(what is|what's) your name": "I'm **SIA** (Smart IPN Assistant)! 🤖",
            r'^what can you do': "I'm your IPN documentation expert! I can help you:\n\n🔍 **Search documentation** for specific files or concepts\n💻 **Explain code** - backend PHP or frontend Vue.js\n🏗️ **Understand architecture** and how components connect\n🐛 **Troubleshoot** by finding relevant implementation details\n\nJust ask me anything about the IPN codebase!",
            
            # Personal/introduction statements
            r'^(my name is|i am|i\'m|call me)': "Nice to meet you! I'm here to help with any IPN documentation questions. What would you like to know?",
            r'^i (just|want to) (wanted to |)say (hi|hello|hey)': "Hello! 👋 Nice to meet you! How can I help you today?",
            
            # General small talk
            r'^what(s up| up|s going on)': "Not much! Just here and ready to help you with IPN documentation. What can I do for you?",
            r'^how (is it going|do you do)': "I'm doing well, thanks! Ready to help with any technical questions about IPN. What would you like to explore?",
            r'^nice to meet you': "Nice to meet you too! 👋 I'm here to help with any IPN documentation questions.",
            r'^good (job|work|response)': "Thank you! 😊 I'm glad I could help!",
        }
        
        logger.info(f"RAG Engine initialized with model: {llm_model}")
    
    def is_ready(self) -> bool:
        """Check if the vector store is loaded and ready"""
        return self.vector_store.index is not None
    
    def get_document_count(self) -> int:
        """Get the number of indexed documents"""
        return len(self.vector_store.metadata) if self.vector_store.metadata else 0
    
    def build_vector_store(self, force_rebuild: bool = False) -> None:
        """Build or rebuild the vector store from documents"""
        if not force_rebuild and self.is_ready():
            logger.info("Vector store already exists, skipping build")
            return
        
        docs_path = Path(self.docs_path)
        if not docs_path.exists():
            raise FileNotFoundError(f"Documents path not found: {docs_path}")
        
        logger.info(f"Loading documents from {docs_path}")
        documents = self.doc_processor.load_documents(docs_path)
        
        logger.info(f"Building vector store from {len(documents)} documents...")
        self.vector_store.build_from_documents(documents)
        logger.info("Vector store built successfully")
    
    def _expand_query(self, query: str) -> str:
        """
        Expand query with synonyms and related terms for better retrieval
        """
        # Technical term expansions for IPN domain
        expansions = {
            'api': ['endpoint', 'rest', 'json', 'request', 'response'],
            'auth': ['authentication', 'login', 'token', 'jwt', 'security'],
            'user': ['customer', 'account', 'profile'],
            'order': ['purchase', 'checkout', 'cart', 'payment'],
            'product': ['item', 'sku', 'variant', 'catalog'],
            'subscription': ['abo', 'recurring', 'frequency', 'delivery'],
            'animal': ['pet', 'dog', 'cat', 'breed'],
            'component': ['vue', 'template', 'ui', 'widget'],
            'composable': ['hook', 'function', 'utility'],
            'entity': ['model', 'doctrine', 'orm', 'database'],
            'controller': ['action', 'route', 'endpoint'],
            'repository': ['dao', 'data access', 'query'],
        }
        
        query_lower = query.lower()
        expanded_terms = []
        
        for term, synonyms in expansions.items():
            if term in query_lower:
                expanded_terms.extend(synonyms)
        
        if expanded_terms:
            return f"{query} {' '.join(expanded_terms)}"
        return query
    
    def _is_casual_query(self, query: str) -> bool:
        """Detect if this is a casual conversation query"""
        query_lower = query.strip().lower()
        for pattern in self.casual_responses.keys():
            if re.match(pattern, query_lower):
                return True
        return False
    
    def _get_casual_response(self, query: str) -> Optional[str]:
        """Get response for casual queries"""
        query_lower = query.strip().lower()
        for pattern, response in self.casual_responses.items():
            if re.match(pattern, query_lower):
                return response
        return None
    
    def _retrieve_chunks(self, query: str, top_k: int = 5) -> List[RetrievedChunk]:
        """
        Retrieve relevant document chunks using semantic search
        """
        # Expand query for better retrieval
        expanded_query = self._expand_query(query)
        
        # Search vector store
        results = self.vector_store.query(expanded_query, top_k=top_k * 2)  # Get more for re-ranking
        
        chunks = []
        for result in results:
            score = result.get('distance', 0)
            metadata = result.get('metadata', {})
            
            # Filter by similarity threshold
            if score < self.similarity_threshold:
                continue
            
            chunk = RetrievedChunk(
                text=metadata.get('text', ''),
                source_file=metadata.get('source_file', 'Unknown'),
                file_path=metadata.get('file_path', ''),
                category=metadata.get('category', 'other'),
                relevance_score=score,
                chunk_index=metadata.get('chunk_index', 0)
            )
            chunks.append(chunk)
        
        # Re-rank by relevance and diversity
        chunks = self._rerank_chunks(chunks, query)
        
        return chunks[:top_k]
    
    def _rerank_chunks(self, chunks: List[RetrievedChunk], query: str) -> List[RetrievedChunk]:
        """
        Re-rank chunks to improve diversity and relevance
        """
        if not chunks:
            return chunks
        
        # Group by category for diversity
        by_category = {}
        for chunk in chunks:
            cat = chunk.category
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(chunk)
        
        # Interleave from different categories
        reranked = []
        categories = list(by_category.keys())
        indices = {cat: 0 for cat in categories}
        
        while len(reranked) < len(chunks):
            for cat in categories:
                if indices[cat] < len(by_category[cat]):
                    reranked.append(by_category[cat][indices[cat]])
                    indices[cat] += 1
        
        return reranked
    
    def _format_context(self, chunks: List[RetrievedChunk]) -> Tuple[str, List[Dict]]:
        """
        Format retrieved chunks into context string and source list
        """
        if not chunks:
            return "", []
        
        context_parts = []
        sources = []
        
        for i, chunk in enumerate(chunks, 1):
            # Format context with source reference
            context_parts.append(
                f"[{i}] File: {chunk.source_file}\n"
                f"Category: {chunk.category}\n"
                f"Content:\n{chunk.text}\n"
            )
            
            sources.append({
                'file': chunk.source_file,
                'path': chunk.file_path,
                'category': chunk.category,
                'score': chunk.relevance_score,
                'index': i
            })
        
        return "\n---\n".join(context_parts), sources
    
    def search_documents(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Search documents directly without LLM processing
        """
        chunks = self._retrieve_chunks(query, top_k=top_k)
        
        results = []
        for chunk in chunks:
            results.append({
                'text': chunk.text[:500] + "..." if len(chunk.text) > 500 else chunk.text,
                'file': chunk.source_file,
                'path': chunk.file_path,
                'category': chunk.category,
                'relevance_score': round(chunk.relevance_score, 3)
            })
        
        return results
    
    def generate_response(
        self, 
        query: str, 
        chat_history: List[ChatMessage] = None,
        validate_output: bool = True
    ) -> Dict[str, Any]:
        """
        Generate a response using RAG
        
        Args:
            query: User query
            chat_history: Previous conversation history
            validate_output: Whether to run output validation
        
        Returns dict with:
        - response: The generated text
        - sources: List of source files used
        - retrieved_chunks: Number of chunks retrieved
        - used_context: Whether context was used
        - is_casual: Whether this was a casual query
        - processing_time_ms: Processing time in milliseconds
        - validation_metrics: Quality metrics (if validate_output=True)
        """
        start_time = time.time()
        chat_history = chat_history or []
        
        # Check for overview/statistics questions first
        overview_response = self.doc_analyzer.get_response(query)
        if overview_response:
            processing_time = int((time.time() - start_time) * 1000)
            result = {
                'response': overview_response,
                'sources': [],
                'retrieved_chunks': 0,
                'used_context': False,
                'is_casual': False,
                'is_overview': True,
                'processing_time_ms': processing_time
            }
            
            # Validate overview responses too
            if validate_output:
                metrics = self.output_validator.validate(
                    query=query,
                    response=overview_response,
                    context="",  # No context for overview responses
                    sources=[]
                )
                result['validation_metrics'] = metrics.to_dict()
            
            return result
        
        # Check for casual queries
        if self._is_casual_query(query):
            casual_response = self._get_casual_response(query)
            if casual_response:
                processing_time = int((time.time() - start_time) * 1000)
                # Skip validation for casual queries - no quality score needed
                return {
                    'response': casual_response,
                    'sources': [],
                    'retrieved_chunks': 0,
                    'used_context': False,
                    'is_casual': True,
                    'processing_time_ms': processing_time
                }
        
        # Retrieve relevant chunks
        chunks = self._retrieve_chunks(query, top_k=5)
        context, sources = self._format_context(chunks)
        
        # Build message list
        messages = [SystemMessage(content=self.system_prompt)]
        
        # Add chat history
        for msg in chat_history:
            if msg.role == 'user':
                messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))
        
        # Add current query with context
        if context:
            user_content = (
                f"Question: {query}\n\n"
                f"Here is relevant documentation to help answer:\n"
                f"{context}\n\n"
                f"Please answer the question based on the documentation above. "
                f"If the documentation doesn't contain the answer, use your general knowledge."
            )
        else:
            user_content = query
        
        messages.append(HumanMessage(content=user_content))
        
        # Generate response
        try:
            response = self.llm.invoke(messages)
            answer = response.content
        except Exception as e:
            logger.error(f"LLM error: {e}")
            answer = "I apologize, but I'm having trouble generating a response right now. Please try again."
        
        processing_time = int((time.time() - start_time) * 1000)
        
        result = {
            'response': answer,
            'sources': sources,
            'retrieved_chunks': len(chunks),
            'used_context': len(chunks) > 0,
            'is_casual': False,
            'processing_time_ms': processing_time
        }
        
        # Validate output quality
        if validate_output:
            try:
                metrics = self.output_validator.validate(
                    query=query,
                    response=answer,
                    context=context,
                    sources=sources
                )
                result['validation_metrics'] = metrics.to_dict()
                
                # Log if quality is poor
                if not metrics.is_valid():
                    logger.warning(
                        f"Low quality response detected: {metrics.to_dict()}"
                    )
            except Exception as e:
                logger.error(f"Validation error: {e}")
        
        return result
    
    def stream_response(
        self, 
        query: str, 
        chat_history: List[ChatMessage] = None
    ) -> Iterator[str]:
        """
        Stream response tokens for real-time display
        """
        chat_history = chat_history or []
        
        # Check for casual queries (no streaming for these)
        if self._is_casual_query(query):
            casual_response = self._get_casual_response(query)
            if casual_response:
                yield casual_response
                return
        
        # Retrieve chunks
        chunks = self._retrieve_chunks(query, top_k=5)
        context, _ = self._format_context(chunks)
        
        # Build messages
        messages = [SystemMessage(content=self.system_prompt)]
        
        for msg in chat_history:
            if msg.role == 'user':
                messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))
        
        if context:
            user_content = (
                f"Question: {query}\n\n"
                f"Here is relevant documentation to help answer:\n{context}\n\n"
                f"Please answer the question based on the documentation above."
            )
        else:
            user_content = query
        
        messages.append(HumanMessage(content=user_content))
        
        # Stream response
        try:
            for chunk in self.llm.stream(messages):
                if chunk.content:
                    yield chunk.content
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield "Sorry, I encountered an error while generating the response."
    
    def get_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        # Get document analyzer stats
        try:
            doc_stats = self.doc_analyzer.get_quick_stats()
        except Exception as e:
            logger.error(f"Error getting doc stats: {e}")
            doc_stats = {}
        
        return {
            'vector_store': {
                'indexed_chunks': self.get_document_count(),
                'embedding_model': self.vector_store.embedding_model,
                'chunk_size': self.chunk_size,
                'chunk_overlap': self.chunk_overlap
            },
            'codebase': doc_stats,
            'configuration': {
                'similarity_threshold': self.similarity_threshold,
                'llm_model': self.llm.model_name,
                'docs_path': self.docs_path
            },
            'status': {
                'ready': self.is_ready(),
                'timestamp': datetime.now().isoformat()
            }
        }
