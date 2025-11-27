from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
import os
import shutil

# Import our engines
# from rag_engine import RAGEngine # Legacy
# from search_agent import SearchAgent # Legacy
from llm_engine import LLMEngine
from theme_engine import ThemeEngine

app = FastAPI(title="Local Research Agent - Seeder & Hunter")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
theme_engine = None
llm_engine = None

class ThemeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[List[str]] = None
    status: Optional[str] = None
    schedule: Optional[str] = None

# --- Flow B: The Hunter (Bucketed Research) ---

from research_engine import ResearchEngine

# Global instance
research_engine = None

@app.on_event("startup")
async def startup_event():
    global theme_engine, llm_engine, research_engine
    print("Initializing LLM Engine...")
    llm_engine = LLMEngine()
    print("Initializing Theme Engine...")
    theme_engine = ThemeEngine()
    print("Initializing Research Engine...")
    research_engine = ResearchEngine()
    print("Seeder & Hunter Agent Ready!")

class ResearchRunRequest(BaseModel):
    theme_id: str

@app.post("/research/run")
async def run_research(request: ResearchRunRequest):
    # Get theme details
    themes = theme_engine.get_themes()
    theme = next((t for t in themes if t["id"] == request.theme_id), None)
    
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")
        
    try:
        result = research_engine.run_research(theme)
        return result
    except Exception as e:
        print(f"Research run error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class DeepDiveRequest(BaseModel):
    url: str

@app.post("/research/deep-dive")
async def deep_dive(request: DeepDiveRequest):
    try:
        summary = research_engine.deep_dive(request.url)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/research/history")
async def get_research_history():
    return research_engine.get_history()

@app.get("/research/history/{run_id}")
async def get_research_run(run_id: str):
    run = research_engine.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

# --- Flow A: The Seeder (Theme Extraction) ---

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Flow A: Upload document -> Extract Themes -> Return Themes
    """
    try:
        # Save file temporarily to read it
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Read text content (Basic text reading for now)
        text_content = ""
        if file.filename.endswith(".pdf"):
            from langchain_community.document_loaders import PyPDFLoader
            loader = PyPDFLoader(file_path)
            docs = loader.load()
            text_content = "\n".join([d.page_content for d in docs])
        else:
            with open(file_path, "r", errors="ignore") as f:
                text_content = f.read()
        
        # Extract themes
        themes = theme_engine.extract_themes(text_content)
        
        # Clean up
        os.remove(file_path)
        
        return {"filename": file.filename, "extracted_themes": themes}
        
    except ValueError as ve:
        # Handle limit reached
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Upload error: {e}")
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

class ThemeCreate(BaseModel):
    name: str
    description: str
    keywords: List[str]
    schedule: str = "weekly"

@app.post("/themes/create")
async def create_theme(theme: ThemeCreate):
    try:
        new_theme = theme_engine.create_theme(
            name=theme.name,
            description=theme.description,
            keywords=theme.keywords,
            schedule=theme.schedule
        )
        return new_theme
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/themes")
async def get_themes():
    return theme_engine.get_themes()

@app.put("/themes/{theme_id}")
async def update_theme(theme_id: str, update: ThemeUpdate):
    try:
        updated_theme = theme_engine.update_theme(theme_id, update.dict(exclude_unset=True))
        if not updated_theme:
            raise HTTPException(status_code=404, detail="Theme not found")
        return updated_theme
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@app.delete("/themes/{theme_id}")
async def delete_theme(theme_id: str):
    success = theme_engine.delete_theme(theme_id)
    if not success:
        raise HTTPException(status_code=404, detail="Theme not found")
    return {"status": "deleted"}

class BulkDeleteRequest(BaseModel):
    theme_ids: List[str]

@app.post("/themes/bulk-delete")
async def bulk_delete_themes(request: BulkDeleteRequest):
    count = theme_engine.delete_themes(request.theme_ids)
    return {"status": "deleted", "count": count}

@app.post("/themes/{theme_id}/activate")
async def activate_theme(theme_id: str):
    try:
        updated_theme = theme_engine.set_theme_status(theme_id, "active")
        if not updated_theme:
            raise HTTPException(status_code=404, detail="Theme not found")
        return updated_theme
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
