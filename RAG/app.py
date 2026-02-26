from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv
from src.vectorstore import FaissVectorStore

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / '.env', override=True)

groq_api_key = os.getenv('GROQ_API_KEY')
if not groq_api_key:
    print("[ERROR] GROQ_API_KEY not found in .env file!")
    exit(1)
else:
    print(f"[INFO] Groq API Key loaded: {groq_api_key[:20]}...")

llm = ChatGroq(groq_api_key=groq_api_key, model_name="llama-3.1-8b-instant")
print("[INFO] Groq LLM initialized: llama-3.1-8b-instant")

SYSTEM_PROMPT = """You are a friendly and knowledgeable AI assistant for IPN (Inspired Pet Nutrition).

Instructions:
- If the message is casual (greetings, small talk, jokes, general questions), respond naturally and conversationally like a real person — keep it short and warm
- If the message is about IPN or the document, answer accurately based on the document content provided
- If the question is general knowledge not in the document, answer from your own knowledge helpfully
- If you truly don't know something, say so honestly
- Never say "based on the context", "according to the context", or similar phrases — just answer naturally
- Never say "I don't have that information in the document" for casual messages or general knowledge questions
- Always sound human and friendly
- Keep casual replies to 1-2 sentences, document answers concise and accurate"""

# Cosine similarity threshold (IndexFlatIP scores range 0.0–1.0, higher = more relevant)
SIMILARITY_THRESHOLD = 0.35

app = Flask(__name__)
CORS(app)

# --- FAISS Vector Store Setup ---
print("[INFO] Initializing FAISS vector store...")
vs = FaissVectorStore()
if not vs.load():
    from src.data_loader import load_all_documents
    docs = load_all_documents("data")
    vs.build_from_documents(docs)
print("[INFO] FAISS vector store ready!")


@app.route('/query', methods=['POST'])
def query():
    data         = request.json
    user_message = data.get('message', '')
    chat_history = data.get('chat_history', [])

    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        print(f"[INFO] Query: {user_message}")

        # Build message list with system prompt
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Include last 6 messages of chat history for context
        for msg in chat_history[-6:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        # Retrieve relevant context from FAISS
        try:
            results = vs.query(user_message, top_k=3)
            chunks = []
            for r in results:
                # IndexFlatIP returns cosine similarity scores (0.0–1.0).
                # Only include chunks that meet the relevance threshold.
                if r["distance"] >= SIMILARITY_THRESHOLD and r["metadata"]:
                    text = r["metadata"].get("text", "").strip()
                    if text:
                        chunks.append(text)
            print(f"[INFO] Retrieved {len(chunks)} relevant chunks from FAISS (threshold={SIMILARITY_THRESHOLD})")

            if chunks:
                context_block = "\n\n".join(chunks)
                user_content = (
                    f"{user_message}\n\n"
                    f"[Reference material — use this to answer accurately, do not mention it explicitly:\n"
                    f"{context_block}]"
                )
            else:
                user_content = user_message

        except Exception as faiss_err:
            print(f"[WARN] FAISS retrieval failed: {faiss_err}")
            user_content = user_message

        messages.append({"role": "user", "content": user_content})

        response = llm.invoke(messages)
        answer = response.content
        print("[INFO] Response generated successfully")
        return jsonify({'response': answer})

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':      'healthy',
        'model':       'llama-3.1-8b-instant',
        'faiss_ready': vs.index is not None,
        'chunks':      len(vs.metadata)
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)