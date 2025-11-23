from ddgs import DDGS
from typing import List, Dict

class SearchAgent:
    def __init__(self):
        self.ddgs = DDGS()
        self.default_domains = [
            "mckinsey.com", "bcg.com", "bain.com", 
            "gartner.com", "arxiv.org", 
            "google.com", "apple.com", "meta.com", "amazon.com", "netflix.com", "microsoft.com" # FAANG/MAANG
        ]

    def search(self, query: str, domains: List[str] = None, max_results: int = 5) -> List[Dict]:
        """
        Searches the web for the query, restricted to specific domains.
        """
        target_domains = domains if domains else self.default_domains
        
        # Construct query with site: operator
        # Note: DDG supports site:domain OR site:domain2, but it can get long.
        # Let's try a simpler approach: search and then filter, or use site: for top priority.
        # A robust way is to append "site:mckinsey.com OR site:bcg.com ..." to the query.
        
        # Constructing a massive OR query might be flaky. 
        # Let's try searching with the query and appending the domain keywords, 
        # or just trusting DDG to find high quality stuff if we add "research paper" or similar.
        # BUT the user specifically asked for these domains.
        
        # Better approach: Iterate through groups of domains or just add "site:..." 
        # Let's try the site: operator with OR.
        
        # Strategy: 
        # 1. General high-credibility search (excluding arxiv to save space)
        # 2. Dedicated Arxiv search to ensure papers are found
        
        general_domains = [d for d in target_domains if "arxiv" not in d]
        site_query = " OR ".join([f"site:{d}" for d in general_domains])
        general_full_query = f"{query} ({site_query})"
        
        arxiv_full_query = f"{query} site:arxiv.org"
        
        print(f"DEBUG: General query: {general_full_query}")
        print(f"DEBUG: Arxiv query: {arxiv_full_query}")
        
        results = []
        try:
            # 1. General Search
            general_results = self.ddgs.text(general_full_query, max_results=3)
            if general_results:
                results.extend(general_results)
            else:
                 # Fallback for general
                 print("DEBUG: General search returned no results. Trying fallback.")
                 results.extend(self.ddgs.text(query, max_results=3))

            # 2. Arxiv Search
            arxiv_results = self.ddgs.text(arxiv_full_query, max_results=2)
            if arxiv_results:
                results.extend(arxiv_results)
                
        except Exception as e:
            print(f"Search error: {e}")
            
        return results
