import json
import os
import uuid
from typing import List, Dict, Optional
from llm_engine import LLMEngine

THEMES_FILE = "themes.json"

class ThemeEngine:
    def __init__(self):
        self.llm = LLMEngine()
        self._load_themes()

    def _load_themes(self):
        if os.path.exists(THEMES_FILE):
            try:
                with open(THEMES_FILE, "r") as f:
                    self.themes = json.load(f)
            except json.JSONDecodeError:
                self.themes = []
        else:
            self.themes = []

    def _save_themes(self):
        with open(THEMES_FILE, "w") as f:
            json.dump(self.themes, f, indent=2)

    def extract_themes(self, text: str) -> List[Dict]:
        """
        Uses LLM to extract themes from the provided text.
        Returns a list of theme dictionaries.
        """
        # Limit check removed for extraction (Drafts are unlimited)

        system_prompt = """You are a Senior Research Analyst. Task: Extract highly specific "Search Themes" from the attached document for a research database.

        The Process (Internal Monologue - Do Not Output):
        Scan 1: Identify the 3 most obvious high-level topics. (e.g., "Generative AI").
        Critique: These are too generic. Discard them.
        Scan 2: Look for specific strategies, problems, or technologies mentioned in the details. (e.g., "Generative AI Code Migration Risks").
        Scan 3: Look for "Shadow Themes"—topics mentioned in charts or footnotes that are distinct from the main headline.
        Refine: Convert the best findings into specific 3-4 word Noun Phrases.

        Output Constraints:
        Length: Exactly 3-4 words per theme.
        Quantity: Top 2-3 distinct themes.
        Banned: Single words ("Inflation"), broad buckets ("Marketing").
        
        Output MUST be valid JSON in the following format:
        [
            {
                "name": "Specific Theme Name",
                "description": "Brief context about why this is a key theme.",
                "keywords": ["specific keyword 1", "specific keyword 2", "specific keyword 3"]
            }
        ]
        IMPORTANT: Use the key "keywords", NOT "examples".
        Do not include any markdown formatting (like ```json). Just the raw JSON string.
        """
        
        # Truncate text if too long to avoid context window issues (simple truncation for now)
        truncated_text = text[:15000] 
        
        response = self.llm.generate(
            prompt=f"Text to analyze:\n{truncated_text}", 
            system_prompt=system_prompt
        )
        
        print(f"DEBUG: LLM Response:\n{response}")
        
        try:
            # Clean up potential markdown code blocks if the LLM ignores instructions
            cleaned_response = response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            
            print(f"DEBUG: Cleaned Response: {cleaned_response}")
                
            new_themes_data = json.loads(cleaned_response)
            print(f"DEBUG: Parsed Data: {new_themes_data}")
            
            if not isinstance(new_themes_data, list):
                print("DEBUG: Parsed data is not a list!")
                return []

            # STRICTLY ENFORCE LIMIT: Take only top 3 if LLM hallucinates more
            new_themes_data = new_themes_data[:3]
            
            created_themes = []
            for t in new_themes_data:
                # Handle potential key variations from LLM
                keywords = t.get("keywords", t.get("examples", []))
                
                theme = {
                    "id": str(uuid.uuid4()),
                    "name": t.get("name", "Untitled Theme"),
                    "description": t.get("description", "No description provided."),
                    "keywords": keywords,
                    "status": "draft", # draft, active
                    "schedule": "weekly" # Default schedule
                }
                created_themes.append(theme)
            
            print(f"DEBUG: Created Themes: {created_themes}")
            
            # Append to local storage
            self.themes.extend(created_themes)
            self._save_themes()
            
            return created_themes
            
        except json.JSONDecodeError as je:
            print(f"Error decoding LLM response: {je}")
            return []
        except Exception as e:
            print(f"Error extracting themes: {e}")
            return []

    def create_theme(self, name: str, description: str, keywords: List[str], schedule: str = "weekly") -> Dict:
        # Limit check removed for creation
            
        theme = {
            "id": str(uuid.uuid4()),
            "name": name,
            "description": description,
            "keywords": keywords,
            "status": "draft",
            "schedule": schedule
        }
        self.themes.append(theme)
        self._save_themes()
        return theme

    def get_themes(self) -> List[Dict]:
        return self.themes

    def update_theme(self, theme_id: str, updates: Dict) -> Optional[Dict]:
        for theme in self.themes:
            if theme["id"] == theme_id:
                # Check limit if trying to activate
                if updates.get("status") == "active" and theme["status"] != "active":
                    active_count = sum(1 for t in self.themes if t["status"] == "active")
                    if active_count >= 3:
                        raise ValueError("Active theme limit reached (3). Deactivate another theme first.")
                
                theme.update(updates)
                self._save_themes()
                return theme
        return None

    def delete_theme(self, theme_id: str) -> bool:
        print(f"DEBUG: Attempting to delete theme {theme_id}")
        initial_len = len(self.themes)
        self.themes = [t for t in self.themes if t["id"] != theme_id]
        if len(self.themes) < initial_len:
            print(f"DEBUG: Deleted theme {theme_id}. New count: {len(self.themes)}")
            self._save_themes()
            return True
        print(f"DEBUG: Theme {theme_id} not found.")
        return False

    def delete_themes(self, theme_ids: List[str]) -> int:
        """Deletes multiple themes. Returns count of deleted themes."""
        initial_len = len(self.themes)
        self.themes = [t for t in self.themes if t["id"] not in theme_ids]
        deleted_count = initial_len - len(self.themes)
        if deleted_count > 0:
            self._save_themes()
        return deleted_count

    def set_theme_status(self, theme_id: str, status: str) -> Optional[Dict]:
        return self.update_theme(theme_id, {"status": status})
