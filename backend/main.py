from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import shutil

# Import our engines
from rag_engine import RAGEngine
from search_agent import SearchAgent
from llm_engine import LLMEngine

app = FastAPI(title="Local RAG Research Agent")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
rag_engine = None 
search_agent = None 
llm_engine = None 

class ResearchRequest(BaseModel):
    query: str
    focus_domains: Optional[List[str]] = None

@app.on_event("startup")
async def startup_event():
    global rag_engine, search_agent, llm_engine
    # Initialize engines
    print("Initializing RAG Engine...")
    rag_engine = RAGEngine()
    print("Initializing Search Agent...")
    search_agent = SearchAgent()
    print("Initializing LLM Engine...")
    llm_engine = LLMEngine()
    print("Local RAG Research Agent Ready!")

@app.get("/")
async def root():
    return {"message": "Local RAG Research Agent API is running"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        # Save file temporarily
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Trigger ingestion
        num_chunks = rag_engine.ingest(file_path)
        
        return {"filename": file.filename, "status": "uploaded", "chunks_ingested": num_chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_research(request: ResearchRequest):
    try:
        # 1. Search local knowledge base
        print(f"Searching local docs for: {request.query}")
        local_context = rag_engine.search(request.query)
        local_context_str = "\n\n".join(local_context)
        
        # 2. Search web (filtered)
        print(f"Searching web for: {request.query}")
        web_results = search_agent.search(request.query, domains=request.focus_domains)
        web_context_str = "\n".join([f"- {r['title']}: {r['body']} ({r['href']})" for r in web_results])
        
        # 3. Synthesize with LLM
        print("Generating article...")
        system_prompt = "You are a senior research analyst. Write a comprehensive research article based on the provided context. Cite your sources."
        
        prompt = f"""
        Query: {request.query}
        
        Local Knowledge Base Context:
        {local_context_str}
        
        Web Search Context (High Credibility Sources):
        {web_context_str}
        
        Instructions:
        - Synthesize the information from both local and web sources.
        - Prioritize the local knowledge base but supplement with web findings.
        - Clearly cite sources (e.g., [Local Doc], [McKinsey], [Arxiv]).
        - Structure the article with clear headings.
        """
        
        article = llm_engine.generate(prompt, system_prompt=system_prompt)
        
        return {
            "article": article,
            "sources": {
                "local": local_context,
                "web": web_results
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
