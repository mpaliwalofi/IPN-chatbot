import os
import re
from dotenv import load_dotenv
from src.vectorstore import FaissVectorStore
from langchain_groq import ChatGroq

load_dotenv()

#System prompt 
SYSTEM_PROMPT = """You are a helpful, friendly, and accurate AI assistant with access to a knowledge base.

STRICT RULES — follow these without exception:
1. NEVER say "based on the context", "according to the context", "the context says", or any similar phrase. Just answer naturally.
2. For greetings or casual messages (Hi, How are you, Thanks, etc.), respond warmly and conversationally — keep it short.
3. When knowledge-base content is available, use it to give a precise, accurate answer. Blend it naturally into your response.
4. When no knowledge-base content is available, answer from your own training knowledge. Do NOT say "I don't have information about this."
5. Be concise. Don't pad answers. Get to the point quickly.
6. Never hallucinate citations, file names, or source references unless explicitly present in the provided content.
7. If a question is truly unanswerable (e.g. personal/private data you have no knowledge of), say so briefly and suggest rephrasing."""

#Relevance threshold 
DISTANCE_THRESHOLD = 0.35


class RAGSearch:
    def __init__(
        self,
        persist_dir: str = "faiss_store",
        embedding_model: str = "all-MiniLM-L6-v2",
        llm_model: str = "llama-3.1-8b-instant",
    ):
        self.vectorstore = FaissVectorStore(persist_dir, embedding_model)

        faiss_path = os.path.join(persist_dir, "faiss.index")
        meta_path  = os.path.join(persist_dir, "metadata.pkl")

        if os.path.exists(faiss_path) and os.path.exists(meta_path):
            self.vectorstore.load()
        else:
            from src.data_loader import load_all_documents
            docs = load_all_documents("data")
            self.vectorstore.build_from_documents(docs)

        groq_api_key = os.getenv("GROQ_API_KEY")
        self.llm = ChatGroq(groq_api_key=groq_api_key, model_name=llm_model)
        print(f"[INFO] Groq LLM initialized: {llm_model}")

    def _is_generic_query(self, query: str) -> bool:
        """
        Detects casual/conversational messages that don't need vector search.
        Skipping search for these saves latency and compute cost.
        """
        generic_patterns = [
            r"^(hi+|hey+|hello+|howdy|hiya)[!?.,]*$",
            r"^how are (you|u)[\s?!.]*$",
            r"^(good\s)?(morning|evening|afternoon|night)[!?.,]*$",
            r"^(thanks?|thank you|thx|ty)[!?.,\s]*$",
            r"^(bye|goodbye|see you|later|cya)[!?.,\s]*$",
            r"^(ok|okay|sure|got it|alright|cool|great)[!?.,\s]*$",
            r"^what('?s| is) (your name|up)[?!.]*$",
            r"^who are you[?!.]*$",
            r"^(nice|awesome|wow|interesting)[!?.,\s]*$",
        ]
        q = query.strip().lower()
        return any(re.match(p, q) for p in generic_patterns)

    def _filter_relevant_chunks(self, results: list) -> list:
        """
        Filters out FAISS results with high L2 distance (= low relevance).
        This is the primary accuracy control — prevents the LLM from being
        misled by chunks that are semantically unrelated to the query.
        """
        filtered = []
        for r in results:
            if r["distance"] >= DISTANCE_THRESHOLD and r["metadata"]:
                text = r["metadata"].get("text", "").strip()
                if text:
                    filtered.append(text)
        return filtered

    def search_and_summarize(
        self,
        query: str,
        top_k: int = 5,
        chat_history: list = [],
    ) -> str:

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        for msg in chat_history[-6:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        if self._is_generic_query(query):
            messages.append({"role": "user", "content": query})
            response = self.llm.invoke(messages)
            return response.content

        results  = self.vectorstore.query(query, top_k=top_k)
        relevant = self._filter_relevant_chunks(results)

        if relevant:
            context_block = "\n\n".join(relevant)
            user_content = (
                f"{query}\n\n"
                f"[Reference material — use this to answer accurately, do not mention it explicitly:\n"
                f"{context_block}]"
            )
        else:
            user_content = query

        messages.append({"role": "user", "content": user_content})
        response = self.llm.invoke(messages)
        return response.content