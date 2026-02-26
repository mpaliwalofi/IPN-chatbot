# IPN RAG Chatbot - Windows Runner Script
# Run this script to start the RAG backend

Write-Host "==============================================" -ForegroundColor Green
Write-Host "  IPN RAG Chatbot Backend" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the RAG directory
if (-not (Test-Path "app.py")) {
    Write-Host "Error: Please run this script from the RAG directory" -ForegroundColor Red
    exit 1
}

# Use the venv python directly
$PythonPath = ".\venv\Scripts\python.exe"

if (-not (Test-Path $PythonPath)) {
    Write-Host "Error: Virtual environment not found. Please run setup first." -ForegroundColor Red
    exit 1
}

Write-Host "Using Python: $PythonPath" -ForegroundColor Cyan
Write-Host ""

# Run the test first
Write-Host "Running system test..." -ForegroundColor Yellow
& $PythonPath test_rag.py

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Tests failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting RAG backend server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start the server
& $PythonPath app.py
