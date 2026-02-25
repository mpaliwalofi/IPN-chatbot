import os
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title="RAG Chat",
    page_icon="💬",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
    font-size: 15px;
}

/* ── App background ── */
.stApp {
    background: #f5f7fa;
}

/* ── Sidebar ── */
section[data-testid="stSidebar"] {
    background: #ffffff;
    border-right: 1px solid #e5e7eb;
    padding-top: 0;
}
section[data-testid="stSidebar"] > div {
    padding: 24px 20px;
}

/* Sidebar brand */
.sidebar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 24px;
}
.sidebar-brand-icon {
    width: 36px; height: 36px;
    background: #2563eb;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
}
.sidebar-brand-text {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    letter-spacing: -0.3px;
}
.sidebar-brand-sub {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 1px;
}

/* Section labels */
.section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #9ca3af;
    margin-bottom: 10px;
    margin-top: 20px;
}

/* Status pills */
.pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    margin-top: 8px;
}
.pill-green  { background: #dcfce7; color: #16a34a; }
.pill-yellow { background: #fef9c3; color: #b45309; }
.pill-red    { background: #fee2e2; color: #dc2626; }
.pill-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/* Override Streamlit widget styles */
.stTextInput > div > div > input,
.stSelectbox > div > div,
.stSlider {
    border-radius: 8px !important;
}

/* Streamlit buttons */
.stButton > button {
    width: 100%;
    background: #2563eb !important;
    color: white !important;
    border: none !important;
    border-radius: 8px !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    padding: 9px 16px !important;
    transition: background 0.15s !important;
    letter-spacing: 0.01em !important;
}
.stButton > button:hover {
    background: #1d4ed8 !important;
}
.stButton > button[kind="secondary"] {
    background: #f3f4f6 !important;
    color: #374151 !important;
}
.stButton > button[kind="secondary"]:hover {
    background: #e5e7eb !important;
}

/* ── Main content area ── */
.main-header {
    padding: 28px 32px 0 32px;
    max-width: 860px;
    margin: 0 auto;
}
.main-title {
    font-size: 22px;
    font-weight: 600;
    color: #111827;
    letter-spacing: -0.4px;
}
.main-subtitle {
    font-size: 13px;
    color: #6b7280;
    margin-top: 4px;
}
.divider {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 16px 0;
}

/* ── Chat area ── */
.chat-wrapper {
    max-width: 860px;
    margin: 0 auto;
    padding: 8px 32px 120px 32px;
}

/* Message rows */
.msg-row {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    animation: fadeSlideIn 0.2s ease;
}
@keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
}
.msg-row.user-row { flex-direction: row-reverse; }

/* Avatars */
.avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
    margin-top: 2px;
}
.avatar-user { background: #dbeafe; color: #2563eb; font-weight: 600; font-size: 13px; }
.avatar-bot  { background: #2563eb; color: white; }

/* Bubbles */
.bubble {
    max-width: 72%;
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 14.5px;
    line-height: 1.65;
    color: #1f2937;
}
.bubble-user {
    background: #2563eb;
    color: #ffffff;
    border-radius: 16px 4px 16px 16px;
}
.bubble-bot {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 4px 16px 16px 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

/* Timestamp */
.msg-time {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 5px;
    padding: 0 4px;
}
.msg-time-user { text-align: right; }

/* Empty state */
.empty-state {
    text-align: center;
    padding: 80px 20px;
    color: #6b7280;
}
.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
}
.empty-title {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
}
.empty-text {
    font-size: 14px;
    color: #9ca3af;
    line-height: 1.6;
}
.suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 24px;
}
.suggestion-chip {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 7px 14px;
    font-size: 13px;
    color: #374151;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
}
.suggestion-chip:hover { background: #f9fafb; border-color: #2563eb; color: #2563eb; }

/* Chat input override */
.stChatInput {
    max-width: 860px;
    margin: 0 auto;
}
.stChatInput > div {
    border-radius: 12px !important;
    border: 1.5px solid #e5e7eb !important;
    background: #ffffff !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
    padding: 4px !important;
}
.stChatInput textarea {
    font-family: 'Inter', sans-serif !important;
    font-size: 14px !important;
    color: #111827 !important;
}
.stChatInput > div:focus-within {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important;
}

/* Warning / error banners */
.stAlert {
    border-radius: 10px !important;
    font-size: 13px !important;
}

/* Spinner */
.stSpinner > div {
    border-top-color: #2563eb !important;
}

/* Typing indicator */
.typing-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 0 20px 0;
}
.typing-bubble {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 4px 16px 16px 16px;
    padding: 12px 16px;
    display: flex;
    gap: 5px;
    align-items: center;
}
.typing-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #9ca3af;
    animation: bounce 1.2s infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30%            { transform: translateY(-5px); }
}

/* Hide Streamlit default elements */
#MainMenu { visibility: hidden; }
footer { visibility: hidden; }
header { visibility: hidden; }
.block-container { padding: 0 !important; max-width: 100% !important; }
</style>
""", unsafe_allow_html=True)


# ── Helpers ───────────────────────────────────────────────────────────────────
def index_exists(persist_dir: str) -> bool:
    return (
        os.path.exists(os.path.join(persist_dir, "faiss.index")) and
        os.path.exists(os.path.join(persist_dir, "metadata.pkl"))
    )

@st.cache_resource(show_spinner=False)
def load_rag(persist_dir: str, embedding_model: str, llm_model: str):
    from src.search import RAGSearch
    return RAGSearch(persist_dir=persist_dir, embedding_model=embedding_model, llm_model=llm_model)

from datetime import datetime
def now_time():
    return datetime.now().strftime("%I:%M %p")


# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div class="sidebar-brand">
        <div class="sidebar-brand-icon">💬</div>
        <div>
            <div class="sidebar-brand-text">RAG Chat</div>
            <div class="sidebar-brand-sub">Knowledge Base Assistant</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown('<div class="section-label">Model Settings</div>', unsafe_allow_html=True)
    persist_dir = st.text_input("FAISS store path", value="faiss_store", label_visibility="collapsed",
                                 placeholder="FAISS store path")
    embedding_model = st.selectbox(
        "Embedding model",
        ["all-MiniLM-L6-v2", "all-mpnet-base-v2", "paraphrase-MiniLM-L3-v2"],
        label_visibility="visible",
    )
    llm_model = st.selectbox(
        "LLM (Groq)",
        ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
        label_visibility="visible",
    )
    top_k = st.slider("Retrieved chunks (top-k)", min_value=1, max_value=10, value=5)

    st.markdown('<div class="section-label">Knowledge Base</div>', unsafe_allow_html=True)
    data_dir = st.text_input("Data directory", value="data", label_visibility="collapsed", placeholder="Data directory")

    # Index status
    if index_exists(persist_dir):
        st.markdown('<div class="pill pill-green"><span class="pill-dot"></span>Index ready</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="pill pill-yellow"><span class="pill-dot"></span>No index found</div>', unsafe_allow_html=True)

    st.markdown("<div style='margin-top:10px'></div>", unsafe_allow_html=True)
    if st.button("🔄 Build / Rebuild Index"):
        with st.spinner("Building index…"):
            try:
                from src.data_loader import load_all_documents
                from src.vectorstore import FaissVectorStore
                docs = load_all_documents(data_dir)
                if not docs:
                    st.error(f"No documents found in '{data_dir}'.")
                else:
                    vs = FaissVectorStore(persist_dir, embedding_model)
                    vs.build_from_documents(docs)
                    load_rag.clear()
                    st.success(f"Indexed {len(docs)} documents ✓")
                    st.rerun()
            except Exception as e:
                st.error(f"Build failed: {e}")

    st.markdown('<div class="section-label">Session</div>', unsafe_allow_html=True)

    # API key status
    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key:
        st.markdown('<div class="pill pill-green"><span class="pill-dot"></span>GROQ API key set</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="pill pill-red"><span class="pill-dot"></span>GROQ_API_KEY missing</div>', unsafe_allow_html=True)

    st.markdown("<div style='margin-top:10px'></div>", unsafe_allow_html=True)
    msg_count = len(st.session_state.get("messages", []))
    st.markdown(f"<div style='font-size:12px;color:#9ca3af;margin-bottom:10px'>{msg_count} message{'s' if msg_count != 1 else ''} in session</div>", unsafe_allow_html=True)

    if st.button("🗑️ Clear Chat", ):
        st.session_state.messages = []
        st.rerun()


# ── Main area ─────────────────────────────────────────────────────────────────
st.markdown("""
<div class="main-header">
    <div class="main-title">💬 Knowledge Base Chat</div>
    <div class="main-subtitle">Ask anything — powered by FAISS · SentenceTransformers · Groq</div>
    <hr class="divider">
</div>
""", unsafe_allow_html=True)

if not index_exists(persist_dir):
    st.markdown("<div style='max-width:860px;margin:0 auto;padding:0 32px'>", unsafe_allow_html=True)
    st.warning("⚠️ No FAISS index found. Add documents to the `data/` folder and click **Build / Rebuild Index** in the sidebar.")
    st.markdown("</div>", unsafe_allow_html=True)

# Init state
if "messages" not in st.session_state:
    st.session_state.messages = []

# ── Chat messages ─────────────────────────────────────────────────────────────
st.markdown('<div class="chat-wrapper">', unsafe_allow_html=True)

if not st.session_state.messages:
    st.markdown("""
    <div class="empty-state">
        <div class="empty-icon">🧠</div>
        <div class="empty-title">How can I help you today?</div>
        <div class="empty-text">Ask me anything about your knowledge base,<br>or just start a conversation.</div>
        <div class="suggestions">
            <span class="suggestion-chip">What is machine learning?</span>
            <span class="suggestion-chip">Explain attention mechanism</span>
            <span class="suggestion-chip">Summarize my documents</span>
            <span class="suggestion-chip">What is AI?</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
else:
    for msg in st.session_state.messages:
        if msg["role"] == "user":
            st.markdown(f"""
            <div class="msg-row user-row">
                <div class="avatar avatar-user">You</div>
                <div>
                    <div class="bubble bubble-user">{msg["content"]}</div>
                    <div class="msg-time msg-time-user">{msg.get("time", "")}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
            <div class="msg-row">
                <div class="avatar avatar-bot">🤖</div>
                <div>
                    <div class="bubble bubble-bot">{msg["content"]}</div>
                    <div class="msg-time">{msg.get("time", "")}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)

st.markdown('</div>', unsafe_allow_html=True)

# ── Chat input ────────────────────────────────────────────────────────────────
if prompt := st.chat_input("Message RAG Chat…"):
    if not index_exists(persist_dir):
        st.error("Please build the index first using the sidebar.")
        st.stop()
    if not os.getenv("GROQ_API_KEY"):
        st.error("GROQ_API_KEY is not set in your .env file.")
        st.stop()

    t = now_time()
    st.session_state.messages.append({"role": "user", "content": prompt, "time": t})

    # Show user bubble immediately
    st.markdown(f"""
    <div class="chat-wrapper">
    <div class="msg-row user-row">
        <div class="avatar avatar-user">You</div>
        <div>
            <div class="bubble bubble-user">{prompt}</div>
            <div class="msg-time msg-time-user">{t}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Typing indicator
    st.markdown("""
    <div class="typing-indicator">
        <div class="avatar avatar-bot">🤖</div>
        <div class="typing-bubble">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    </div>
    </div>
    """, unsafe_allow_html=True)

    with st.spinner(""):
        try:
            rag = load_rag(persist_dir, embedding_model, llm_model)
            history = st.session_state.messages[:-1]
            answer = rag.search_and_summarize(prompt, top_k=top_k, chat_history=history)
        except Exception as e:
            answer = f"⚠️ Something went wrong: {e}"

    t2 = now_time()
    st.session_state.messages.append({"role": "assistant", "content": answer, "time": t2})
    st.rerun()