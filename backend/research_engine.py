import json
import os
import uuid
import time
from datetime import datetime
from typing import List, Dict, Optional
from ddgs import DDGS
from llm_engine import LLMEngine

HISTORY_FILE = "history.json"

class ResearchEngine:
    def __init__(self):
        self.ddgs = DDGS()
        self.llm = LLMEngine()
        self._load_history()

    def _load_history(self):
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, "r") as f:
                    self.history = json.load(f)
            except json.JSONDecodeError:
                self.history = []
        else:
            self.history = []

    def _save_history(self):
        with open(HISTORY_FILE, "w") as f:
            json.dump(self.history, f, indent=2)

    def run_research(self, theme: Dict) -> Dict:
        """
        Orchestrates the research process for a single theme across 5 buckets.
        """
        run_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        print(f"Starting research for theme: {theme['name']}")
        
        buckets = {
            "mbb": ["mckinsey.com", "bcg.com", "bain.com"],
            "market": ["gartner.com", "forrester.com"],
            "reddit": ["reddit.com"],
            "arxiv": ["arxiv.org"],
            "youtube": ["youtube.com"]
        }
        
        bucket_results = {}
        
        for bucket_name, domains in buckets.items():
            print(f"Searching bucket: {bucket_name}...")
            results = self._search_bucket(theme, domains, bucket_name)
            ranked_results = self._rank_results(results, theme['keywords'])
            summary = self._summarize_bucket(bucket_name, ranked_results, theme)
            
            bucket_results[bucket_name] = {
                "results": ranked_results[:5], # Top 5
                "summary": summary
            }
            # Sleep briefly to avoid rate limits
            time.sleep(1)
            
        research_run = {
            "id": run_id,
            "theme_id": theme['id'],
            "theme_name": theme['name'],
            "timestamp": timestamp,
            "buckets": bucket_results
        }
        
        self.history.append(research_run)
        self._save_history()
        
        return research_run

    def _search_bucket(self, theme: Dict, domains: List[str], bucket_name: str) -> List[Dict]:
        query = f"{theme['name']} {' '.join(theme['keywords'][:3])}"
        
        # Construct site: query
        site_query = " OR ".join([f"site:{d}" for d in domains])
        full_query = f"{query} ({site_query})"
        
        # Special handling for YouTube/Reddit if needed, but site: works well for text
        # For Arxiv, we might want to be less strict with keywords if no results, but let's try strict first
        
        try:
            results = self.ddgs.text(full_query, max_results=10)
            if not results:
                # Fallback: less strict query
                fallback_query = f"{theme['name']} ({site_query})"
                results = self.ddgs.text(fallback_query, max_results=10)
            return results if results else []
        except Exception as e:
            print(f"Error searching bucket {bucket_name}: {e}")
            return []

    def _rank_results(self, results: List[Dict], keywords: List[str]) -> List[Dict]:
        """
        Simple ranking based on keyword presence in title/body.
        """
        scored_results = []
        for r in results:
            score = 0
            text = (r.get('title', '') + " " + r.get('body', '')).lower()
            
            for k in keywords:
                if k.lower() in text:
                    score += 1
            
            # Boost for PDF (often research papers)
            if r.get('href', '').endswith('.pdf'):
                score += 0.5
                
            scored_results.append((score, r))
            
        # Sort by score desc
        scored_results.sort(key=lambda x: x[0], reverse=True)
        return [x[1] for x in scored_results]

    def _summarize_bucket(self, bucket_name: str, results: List[Dict], theme: Dict) -> str:
        if not results:
            return "No relevant results found in this category."
            
        context = "\n".join([f"- {r['title']}: {r['body']}" for r in results[:5]])
        
        prompt = f"""
        Analyze the following search results from the '{bucket_name}' category regarding the theme '{theme['name']}'.
        
        Search Results:
        {context}
        
        Instructions:
        - Write a concise 3-5 sentence summary of what this source category is saying about the theme.
        - Synthesize trends, sentiment, and key ideas.
        - Do not list the results individually.
        """
        
        return self.llm.generate(prompt)

    def get_history(self) -> List[Dict]:
        return self.history
    
    def get_run(self, run_id: str) -> Optional[Dict]:
        for run in self.history:
            if run["id"] == run_id:
                return run
        return None

    def deep_dive(self, url: str) -> str:
        """
        Fetches content from URL and generates a deep summary.
        """
        try:
            from langchain_community.document_loaders import WebBaseLoader
            loader = WebBaseLoader(url)
            docs = loader.load()
            content = "\n".join([d.page_content for d in docs])
            
            # Truncate to avoid context limit
            content = content[:15000]
            
            prompt = f"""
            Analyze the following article content:
            
            {content}
            
            Instructions:
            - Provide a structured deep dive summary.
            - Format:
              - **Key Arguments**: Bullet points of main claims.
              - **Evidence**: Data, case studies, or quotes used.
              - **Implications**: What this means for the industry/theme.
              - **TL;DR**: A one-sentence takeaway.
            """
            
            return self.llm.generate(prompt)
        except Exception as e:
            return f"Error performing deep dive: {str(e)}"
