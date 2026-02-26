#!/usr/bin/env python3
"""
IPN RAG Chatbot Test Script
Verifies the RAG system is working correctly
"""

import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()


def test_environment():
    """Test that environment is properly configured"""
    print("\n[1/5] Testing environment configuration...")
    
    groq_key = os.getenv('GROQ_API_KEY')
    if not groq_key:
        print("  [FAIL] GROQ_API_KEY not found in .env")
        return False
    
    if 'your_groq' in groq_key or groq_key == 'your_groq_api_key_here':
        print("  [FAIL] GROQ_API_KEY appears to be a placeholder")
        return False
    
    print(f"  [OK] GROQ_API_KEY configured: {groq_key[:20]}...")
    return True


def test_imports():
    """Test that all required packages can be imported"""
    print("\n[2/5] Testing package imports...")
    
    try:
        import faiss
        print("  [OK] faiss")
    except ImportError as e:
        print(f"  [FAIL] faiss: {e}")
        return False
    
    try:
        import sentence_transformers
        print("  [OK] sentence_transformers")
    except ImportError as e:
        print(f"  [FAIL] sentence_transformers: {e}")
        return False
    
    try:
        import langchain_groq
        print("  [OK] langchain_groq")
    except ImportError as e:
        print(f"  [FAIL] langchain_groq: {e}")
        return False
    
    try:
        from flask import Flask
        print("  [OK] flask")
    except ImportError as e:
        print(f"  [FAIL] flask: {e}")
        return False
    
    return True


def test_documents():
    """Test that documentation files exist"""
    print("\n[3/5] Testing documentation files...")
    
    docs_path = Path(__file__).parent.parent / "public" / "docs"
    
    if not docs_path.exists():
        print(f"  [FAIL] Documentation path not found: {docs_path}")
        return False
    
    md_files = list(docs_path.rglob("*.md"))
    count = len(md_files)
    
    if count == 0:
        print("  [FAIL] No markdown files found")
        return False
    
    print(f"  [OK] Found {count} documentation files")
    
    # Show sample files by category
    backend_samples = [f for f in md_files if 'config_' in f.name.lower() or 'entity_' in f.name.lower()][:2]
    frontend_samples = [f for f in md_files if 'component_' in f.name.lower() or 'vue' in f.name.lower()][:2]
    
    if backend_samples:
        print(f"  [OK] Backend sample: {backend_samples[0].name}")
    if frontend_samples:
        print(f"  [OK] Frontend sample: {frontend_samples[0].name}")
    
    return True


def test_vector_store():
    """Test vector store initialization"""
    print("\n[4/5] Testing vector store...")
    
    from src.vectorstore import FaissVectorStore
    
    try:
        vs = FaissVectorStore()
        print(f"  [OK] Vector store initialized")
        print(f"  [OK] Embedding model: {vs.embedding_model}")
        print(f"  [OK] Embedding dimension: {vs.embedding_dim}")
        
        # Try to load existing index
        if vs.load():
            print(f"  [OK] Existing index loaded with {len(vs.metadata)} chunks")
        else:
            print("  [WARN] No existing index found (will be built on first run)")
        
        return True
        
    except Exception as e:
        print(f"  [FAIL] Vector store error: {e}")
        return False


def test_llm():
    """Test LLM connection"""
    print("\n[5/5] Testing LLM connection...")
    
    try:
        from langchain_groq import ChatGroq
        
        groq_key = os.getenv('GROQ_API_KEY')
        llm = ChatGroq(
            groq_api_key=groq_key,
            model_name="llama-3.1-8b-instant"
        )
        
        # Test with a simple prompt
        response = llm.invoke("Say 'RAG system ready' in 3 words or less.")
        
        print(f"  [OK] LLM connected successfully")
        print(f"  [OK] Test response: {response.content[:50]}...")
        
        return True
        
    except Exception as e:
        print(f"  [FAIL] LLM error: {e}")
        print("  Make sure your GROQ_API_KEY is valid")
        return False


def main():
    print("="*60)
    print("  IPN RAG Chatbot System Test")
    print("="*60)
    
    results = []
    
    results.append(("Environment", test_environment()))
    results.append(("Imports", test_imports()))
    results.append(("Documents", test_documents()))
    results.append(("Vector Store", test_vector_store()))
    results.append(("LLM", test_llm()))
    
    print("\n" + "="*60)
    print("  Test Results")
    print("="*60)
    
    all_passed = True
    for name, passed in results:
        status = "[PASS]" if passed else "[FAIL]"
        print(f"  {status}: {name}")
        if not passed:
            all_passed = False
    
    print("="*60)
    
    if all_passed:
        print("\n[SUCCESS] All tests passed! Your RAG system is ready.")
        print("\nRun 'python app.py' to start the server.")
        return 0
    else:
        print("\n[WARNING] Some tests failed. Please fix the issues above.")
        print("\nFor help, see: RAG_SETUP.md")
        return 1


if __name__ == "__main__":
    sys.exit(main())
