#!/bin/bash

# Add Homebrew to PATH
export PATH=$PATH:/opt/homebrew/bin

# Function to kill background processes on exit
cleanup() {
    echo "Shutting down..."
    kill $(jobs -p)
    exit
}
trap cleanup SIGINT

echo "Starting Local RAG Research Agent..."

# Check for Ollama
if ! command -v ollama &> /dev/null; then
    echo "Error: Ollama is not installed or not in PATH."
    exit 1
fi

# Start Ollama if not running (this might fail if already running as service, which is fine)
ollama serve &> /dev/null &
sleep 2

# Pull model if needed
echo "Checking for LLM model..."
ollama pull mistral

# Start Backend
echo "Starting Backend..."
cd backend
/opt/miniconda3/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "App running at http://localhost:5173"
echo "Backend running at http://localhost:8000"
echo "Press Ctrl+C to stop."

wait
