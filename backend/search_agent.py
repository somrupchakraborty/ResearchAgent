from duckduckgo_search import DDGS
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
        
        site_query = " OR ".join([f"site:{d}" for d in target_domains])
        full_query = f"{query} ({site_query})"
        
        results = []
        try:
            # DDGS text search
            ddg_results = self.ddgs.text(full_query, max_results=max_results)
            if ddg_results:
                results = ddg_results
        except Exception as e:
            print(f"Search error: {e}")
            
        return results
