"""
FAISS Vector Store - Semantic search for documentation
Supports persistence and efficient similarity search
"""

import os
import faiss
import numpy as np
import pickle
import logging
from pathlib import Path
from typing import List, Any, Optional, Dict
from sentence_transformers import SentenceTransformer
try:
    from langchain.schema import Document
except ImportError:
    from langchain_core.documents import Document

logger = logging.getLogger(__name__)


class FaissVectorStore:
    """
    FAISS-based vector store for document retrieval
    
    Features:
    - Cosine similarity search via L2 normalization + IndexFlatIP
    - Persistent storage of index and metadata
    - Efficient batch encoding
    - Metadata-rich retrieval
    """
    
    def __init__(
        self,
        persist_dir: str = "faiss_store",
        embedding_model: str = "all-MiniLM-L6-v2",
        chunk_size: int = 800,
        chunk_overlap: int = 200,
    ):
        """
        Initialize the vector store
        
        Args:
            persist_dir: Directory to store the index and metadata
            embedding_model: Sentence-transformers model name
            chunk_size: Target chunk size for document splitting
            chunk_overlap: Overlap between chunks
        """
        self.persist_dir = Path(persist_dir)
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        
        self.embedding_model = embedding_model
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict[str, Any]] = []
        
        # Load embedding model
        logger.info(f"Loading embedding model: {embedding_model}")
        self.model = SentenceTransformer(embedding_model)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        logger.info(f"Embedding dimension: {self.embedding_dim}")
    
    def _normalize(self, embeddings: np.ndarray) -> np.ndarray:
        """
        L2-normalize embeddings for cosine similarity
        """
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        return embeddings / np.maximum(norms, 1e-10)
    
    def _embed_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """
        Encode texts to embeddings in batches
        """
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            embeddings = self.model.encode(
                batch,
                convert_to_numpy=True,
                show_progress_bar=False
            )
            all_embeddings.append(embeddings)
            
            if (i + batch_size) % 1000 == 0:
                logger.info(f"Embedded {min(i + batch_size, len(texts))}/{len(texts)} chunks")
        
        return np.vstack(all_embeddings).astype("float32")
    
    def build_from_documents(
        self, 
        documents: List[Document],
        batch_size: int = 1000
    ) -> None:
        """
        Build the vector store from LangChain documents
        
        Args:
            documents: List of Document objects with page_content and metadata
            batch_size: Number of documents to process at once
        """
        if not documents:
            logger.warning("No documents provided to build index")
            return
        
        logger.info(f"Building vector store from {len(documents)} document chunks...")
        
        # Extract texts and metadata
        texts = []
        metadatas = []
        
        for doc in documents:
            texts.append(doc.page_content)
            # Ensure metadata is serializable
            meta = dict(doc.metadata) if doc.metadata else {}
            meta['text'] = doc.page_content  # Store full text in metadata
            metadatas.append(meta)
        
        # Encode in batches
        logger.info(f"Encoding {len(texts)} chunks to embeddings...")
        embeddings = self._embed_texts(texts, batch_size=batch_size)
        
        # Initialize FAISS index
        logger.info("Initializing FAISS index...")
        self.index = faiss.IndexFlatIP(self.embedding_dim)
        
        # Normalize and add embeddings
        normalized_embeddings = self._normalize(embeddings)
        
        # Add in batches to avoid memory issues
        for i in range(0, len(normalized_embeddings), batch_size):
            batch = normalized_embeddings[i:i + batch_size]
            self.index.add(batch)
            logger.info(f"Added {min(i + batch_size, len(normalized_embeddings))} vectors to index")
        
        self.metadata = metadatas
        
        # Persist
        self.save()
        
        logger.info(f"Vector store built successfully with {len(documents)} chunks")
    
    def add_documents(self, documents: List[Document]) -> None:
        """
        Add new documents to the existing index
        """
        if not documents:
            return
        
        if self.index is None:
            logger.info("No existing index found, building new one...")
            self.build_from_documents(documents)
            return
        
        logger.info(f"Adding {len(documents)} new documents...")
        
        texts = [doc.page_content for doc in documents]
        metadatas = []
        
        for doc in documents:
            meta = dict(doc.metadata) if doc.metadata else {}
            meta['text'] = doc.page_content
            metadatas.append(meta)
        
        # Encode and normalize
        embeddings = self._embed_texts(texts)
        normalized_embeddings = self._normalize(embeddings)
        
        # Add to index
        self.index.add(normalized_embeddings)
        self.metadata.extend(metadatas)
        
        # Save updated index
        self.save()
        
        logger.info(f"Added {len(documents)} documents. Total: {len(self.metadata)}")
    
    def save(self) -> None:
        """
        Save the index and metadata to disk
        """
        if self.index is None:
            logger.warning("No index to save")
            return
        
        index_path = self.persist_dir / "faiss.index"
        metadata_path = self.persist_dir / "metadata.pkl"
        
        # Save FAISS index
        faiss.write_index(self.index, str(index_path))
        
        # Save metadata
        with open(metadata_path, "wb") as f:
            pickle.dump(self.metadata, f)
        
        logger.info(f"Saved index and metadata to {self.persist_dir}")
    
    def load(self) -> bool:
        """
        Load the index and metadata from disk
        
        Returns:
            True if successful, False if files don't exist
        """
        index_path = self.persist_dir / "faiss.index"
        metadata_path = self.persist_dir / "metadata.pkl"
        
        if not index_path.exists() or not metadata_path.exists():
            logger.info(f"No existing index found at {self.persist_dir}")
            return False
        
        try:
            # Load FAISS index
            self.index = faiss.read_index(str(index_path))
            
            # Load metadata
            with open(metadata_path, "rb") as f:
                self.metadata = pickle.load(f)
            
            logger.info(f"Loaded index with {len(self.metadata)} chunks from {self.persist_dir}")
            return True
            
        except Exception as e:
            logger.error(f"Error loading index: {e}")
            self.index = None
            self.metadata = []
            return False
    
    def search(
        self, 
        query_embedding: np.ndarray, 
        top_k: int = 5,
        filter_fn: Optional[callable] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors
        
        Args:
            query_embedding: The query vector (will be normalized)
            top_k: Number of results to return
            filter_fn: Optional filter function for metadata
            
        Returns:
            List of result dicts with index, distance (cosine similarity), and metadata
        """
        if self.index is None:
            raise RuntimeError("Vector store is empty. Build or load the index first.")
        
        # Normalize query embedding
        query_embedding = self._normalize(query_embedding.astype("float32"))
        
        # Search
        distances, indices = self.index.search(query_embedding, top_k)
        
        results = []
        for idx, score in zip(indices[0], distances[0]):
            if idx < 0 or idx >= len(self.metadata):
                continue
            
            meta = self.metadata[idx]
            
            # Apply filter if provided
            if filter_fn and not filter_fn(meta):
                continue
            
            results.append({
                "index": int(idx),
                "distance": float(score),  # Cosine similarity (higher = more similar)
                "metadata": dict(meta)
            })
        
        return results
    
    def query(
        self, 
        query_text: str, 
        top_k: int = 5,
        filter_category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Query the vector store with text
        
        Args:
            query_text: The search query
            top_k: Number of results to return
            filter_category: Optional category filter ('backend', 'frontend', 'other')
            
        Returns:
            List of result dicts
        """
        logger.debug(f"Querying: '{query_text[:50]}...'")
        
        # Encode query
        query_embedding = self.model.encode([query_text]).astype("float32")
        
        # Build filter function if category specified
        filter_fn = None
        if filter_category:
            filter_fn = lambda meta: meta.get('category') == filter_category
        
        # Search
        results = self.search(query_embedding, top_k=top_k, filter_fn=filter_fn)
        
        logger.debug(f"Found {len(results)} results")
        return results
    
    def get_document_by_index(self, idx: int) -> Optional[Dict[str, Any]]:
        """
        Get a document by its index
        """
        if 0 <= idx < len(self.metadata):
            return self.metadata[idx]
        return None
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get store statistics
        """
        return {
            'total_chunks': len(self.metadata),
            'embedding_dim': self.embedding_dim,
            'embedding_model': self.embedding_model,
            'index_size_mb': os.path.getsize(self.persist_dir / "faiss.index") / (1024 * 1024) 
                if (self.persist_dir / "faiss.index").exists() else 0
        }
