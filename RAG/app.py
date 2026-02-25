from src.data_loader import load_all_documents
from src.vectorstore import FaissVectorStore

if __name__ == "__main__":
    print("[INFO] Loading documents from data/...")
    docs = load_all_documents("data")
    print(f"[INFO] Loaded {len(docs)} documents.")

    print("[INFO] Building and saving FAISS index...")
    store = FaissVectorStore("faiss_store")
    store.build_from_documents(docs)
    print("[INFO] Index saved to faiss_store/. You can now run: streamlit run streamlit_app.py")
