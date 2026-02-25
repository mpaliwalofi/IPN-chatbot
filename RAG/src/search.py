import os
from dotenv import load_dotenv
from src.vectorstore import FaissVectorStore
from langchain_groq import ChatGroq

load_dotenv()

SYSTEM_PROMPT = """You are a friendly and knowledgeable AI assistant. 

Rules:
- For greetings or casual conversation (e.g. "Hi", "How are you"), respond naturally and warmly — no need to reference any documents.
- When answering questions, speak naturally and confidently. NEVER say phrases like "based on the context", "according to the provided context", "the context mentions", or any similar phrasing. Just answer directly.
- If you have relevant information (either from provided context or your own knowledge), answer clearly and concisely.
- Keep answers concise unless the user asks for detail.
- If you truly don't know something, say so honestly."""


class RAGSearch:
    def __init__(self, persist_dir: str = "faiss_store", embedding_model: str = "all-MiniLM-L6-v2", llm_model: str = "llama-3.1-8b-instant"):
        self.vectorstore = FaissVectorStore(persist_dir, embedding_model)
        faiss_path = os.path.join(persist_dir, "faiss.index")
        meta_path = os.path.join(persist_dir, "metadata.pkl")
        if not (os.path.exists(faiss_path) and os.path.exists(meta_path)):
            from src.data_loader import load_all_documents
            docs = load_all_documents("data")
            self.vectorstore.build_from_documents(docs)
        else:
            self.vectorstore.load()
        groq_api_key = os.getenv("GROQ_API_KEY")
        self.llm = ChatGroq(groq_api_key=groq_api_key, model_name=llm_model)
        print(f"[INFO] Groq LLM initialized: {llm_model}")

    def _is_conversational(self, query: str) -> bool:
        """Detect casual/greeting messages that don't need vector search."""
        greetings = {"hi", "hello", "hey", "how are you", "what's up", "good morning",
                     "good evening", "good afternoon", "sup", "howdy", "bye", "goodbye", "thanks", "thank you"}
        q = query.strip().lower().rstrip("!?.")
        return q in greetings or len(query.split()) <= 3 and q in greetings

    def search_and_summarize(self, query: str, top_k: int = 5, chat_history: list = []) -> str:
        # Build message list with system prompt
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add chat history
        for msg in chat_history:
            messages.append({"role": msg["role"], "content": msg["content"]})

        # Skip vector search for casual messages
        if self._is_conversational(query):
            messages.append({"role": "user", "content": query})
            response = self.llm.invoke(messages)
            return response.content

        # Vector search for knowledge queries
        results = self.vectorstore.query(query, top_k=top_k)
        texts = [r["metadata"].get("text", "") for r in results if r["metadata"]]

        # Filter out low-quality/empty chunks
        texts = [t.strip() for t in texts if t.strip()]
        context = "\n\n".join(texts)

        if context:
            user_content = f"{query}\n\n[Relevant information for reference:\n{context}]"
        else:
            user_content = query

        messages.append({"role": "user", "content": user_content})
        response = self.llm.invoke(messages)
        return response.content