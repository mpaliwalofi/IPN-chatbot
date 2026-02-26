#!/usr/bin/env python3
"""
IPN RAG Chatbot Setup Script
Automates the initial setup process
"""

import os
import sys
import subprocess
from pathlib import Path


def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60 + "\n")


def print_step(step_num, text):
    print(f"[{step_num}/6] {text}")


def check_python_version():
    if sys.version_info < (3, 9):
        print("❌ Python 3.9 or higher is required")
        sys.exit(1)
    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor} detected")


def create_virtual_environment():
    venv_path = Path("venv")
    if venv_path.exists():
        print("✓ Virtual environment already exists")
        return
    
    print("Creating virtual environment...")
    subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
    print("✓ Virtual environment created")


def get_activate_script():
    if os.name == 'nt':  # Windows
        return "venv\\Scripts\\activate"
    else:  # macOS/Linux
        return "source venv/bin/activate"


def install_dependencies():
    print("Installing dependencies...")
    
    # Determine pip path
    if os.name == 'nt':
        pip_path = "venv\\Scripts\\pip"
    else:
        pip_path = "venv/bin/pip"
    
    # Upgrade pip first
    subprocess.run([pip_path, "install", "--upgrade", "pip"], check=True)
    
    # Install requirements
    subprocess.run([pip_path, "install", "-r", "requirements.txt"], check=True)
    print("✓ Dependencies installed")


def check_env_file():
    env_path = Path(".env")
    env_example = Path(".env.example")
    
    if env_path.exists():
        print("✓ .env file already exists")
        with open(env_path) as f:
            content = f.read()
            if "your_groq_api_key" in content or "GROQ_API_KEY=" not in content:
                print("\n⚠️  WARNING: .env file exists but may not have a valid API key")
                print("   Please edit .env and add your Groq API key")
                return False
        return True
    
    if env_example.exists():
        print("Creating .env from .env.example...")
        with open(env_example) as f:
            content = f.read()
        with open(env_path, "w") as f:
            f.write(content)
        print("✓ .env file created")
        print("\n⚠️  IMPORTANT: Edit .env and add your Groq API key!")
        print("   Get your key from: https://console.groq.com/keys")
        return False
    else:
        print("Creating .env file...")
        with open(env_path, "w") as f:
            f.write("GROQ_API_KEY=your_groq_api_key_here\n")
        print("✓ .env file created")
        print("\n⚠️  IMPORTANT: Edit .env and add your Groq API key!")
        return False


def verify_imports():
    print("Verifying installation...")
    
    # Determine python path
    if os.name == 'nt':
        python_path = "venv\\Scripts\\python"
    else:
        python_path = "venv/bin/python"
    
    test_script = """
import faiss
import numpy
import flask
import sentence_transformers
import langchain_groq
print("✓ All imports successful")
"""
    
    result = subprocess.run(
        [python_path, "-c", test_script],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print("❌ Import verification failed:")
        print(result.stderr)
        sys.exit(1)
    
    print(result.stdout.strip())


def check_documents():
    docs_path = Path(__file__).parent.parent / "public" / "docs"
    
    if not docs_path.exists():
        print(f"❌ Documentation directory not found: {docs_path}")
        print("   Make sure you're running from the project root")
        return False
    
    md_files = list(docs_path.rglob("*.md"))
    count = len(md_files)
    
    if count == 0:
        print("❌ No markdown files found in public/docs/")
        return False
    
    print(f"✓ Found {count} documentation files")
    return True


def print_next_steps():
    print_header("Setup Complete!")
    
    print("""
Next steps:
-----------

1. Add your Groq API key to .env:
   GROQ_API_KEY=gsk_your_actual_key_here
   
   Get your key from: https://console.groq.com/keys

2. Activate the virtual environment:
   {activate}

3. Run the RAG backend:
   python app.py

4. In a new terminal, start the frontend:
   npm run dev

5. Open http://localhost:5173 and click the chat button!

The first run will build the vector store (takes 5-10 minutes).
Subsequent runs will be much faster.

For more information, see: RAG_SETUP.md
""".format(activate=get_activate_script()))


def main():
    print_header("IPN RAG Chatbot Setup")
    
    # Check if running from correct directory
    if not Path("app.py").exists():
        print("❌ Please run this script from the RAG directory")
        sys.exit(1)
    
    # Step 1: Check Python version
    print_step(1, "Checking Python version...")
    check_python_version()
    
    # Step 2: Create virtual environment
    print_step(2, "Setting up virtual environment...")
    create_virtual_environment()
    
    # Step 3: Install dependencies
    print_step(3, "Installing dependencies...")
    install_dependencies()
    
    # Step 4: Verify imports
    print_step(4, "Verifying installation...")
    verify_imports()
    
    # Step 5: Check documents
    print_step(5, "Checking documentation files...")
    has_docs = check_documents()
    
    # Step 6: Check environment
    print_step(6, "Checking environment configuration...")
    has_env = check_env_file()
    
    # Print next steps
    print_next_steps()
    
    if not has_env or not has_docs:
        print("\n⚠️  Please complete the steps marked above before running the server.")
        sys.exit(1)


if __name__ == "__main__":
    main()
