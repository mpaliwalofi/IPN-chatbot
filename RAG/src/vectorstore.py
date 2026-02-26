import os
import faiss
import numpy as np
import pickle
from typing import List, Any
from sentence_transformers import SentenceTransformer
from src.embedding import EmbeddingPipeline

class FaissVectorStore:
    def __init__(
        self,
        persist_dir: str = "faiss_store",
        embedding_model: str = "all-MiniLM-L6-v2",
        chunk_size: int = 800,
        chunk_overlap: int = 200,
    ):
        self.persist_dir     = persist_dir
        self.embedding_model = embedding_model
        self.chunk_size      = chunk_size
        self.chunk_overlap   = chunk_overlap
        self.index           = None
        self.metadata        = []

        os.makedirs(self.persist_dir, exist_ok=True)
        self.model = SentenceTransformer(embedding_model)
        print(f"[INFO] Loaded embedding model: {embedding_model}")

    def _normalize(self, embeddings: np.ndarray) -> np.ndarray:
        """L2-normalize embeddings for cosine similarity via IndexFlatIP."""
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        return embeddings / np.maximum(norms, 1e-10)

    def build_from_documents(self, documents: List[Any]):
        print(f"[INFO] Building vector store from {len(documents)} raw documents...")
        emb_pipe   = EmbeddingPipeline(
            model_name=self.embedding_model,
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
        )
        chunks     = emb_pipe.chunk_documents(documents)
        embeddings = emb_pipe.embed_chunks(chunks)
        metadatas  = [{"text": chunk.page_content} for chunk in chunks]

        self.add_embeddings(np.array(embeddings).astype("float32"), metadatas)
        self.save()
        print(f"[INFO] Vector store built and saved to {self.persist_dir}")

    def add_embeddings(self, embeddings: np.ndarray, metadatas: List[Any] = None):
        embeddings = self._normalize(embeddings.astype("float32"))
        dim = embeddings.shape[1]

        if self.index is None:
            self.index = faiss.IndexFlatIP(dim)

        self.index.add(embeddings)
        if metadatas:
            self.metadata.extend(metadatas)
        print(f"[INFO] Added {embeddings.shape[0]} vectors to FAISS index.")

    def save(self):
        faiss.write_index(self.index, os.path.join(self.persist_dir, "faiss.index"))
        with open(os.path.join(self.persist_dir, "metadata.pkl"), "wb") as f:
            pickle.dump(self.metadata, f)
        print(f"[INFO] Saved FAISS index and metadata to {self.persist_dir}")

    def load(self) -> bool:
        faiss_path = os.path.join(self.persist_dir, "faiss.index")
        meta_path  = os.path.join(self.persist_dir, "metadata.pkl")

        if not os.path.exists(faiss_path) or not os.path.exists(meta_path):
            print("[WARN] No existing FAISS index found.")
            return False

        self.index = faiss.read_index(faiss_path)
        with open(meta_path, "rb") as f:
            self.metadata = pickle.load(f)

        print(f"[INFO] Loaded FAISS index and metadata from {self.persist_dir}")
        return True

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[dict]:
        if self.index is None:
            raise RuntimeError("Vector store is empty. Build or load the index first.")

        D, I = self.index.search(query_embedding, top_k)
        results = []
        for idx, score in zip(I[0], D[0]):
            meta = self.metadata[idx] if 0 <= idx < len(self.metadata) else None
            results.append({
                "index":    idx,
                "distance": float(score),  
                "metadata": meta,
            })
        return results

    def query(self, query_text: str, top_k: int = 5) -> List[dict]:
        print(f"[INFO] Querying vector store: '{query_text}'")
        query_emb = self.model.encode([query_text]).astype("float32")
        query_emb = self._normalize(query_emb)
        return self.search(query_emb, top_k=top_k)