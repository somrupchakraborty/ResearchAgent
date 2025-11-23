import requests
import json

class LLMEngine:
    def __init__(self, model="mistral", base_url="http://localhost:11434"):
        self.model = model
        self.base_url = base_url

    def generate(self, prompt: str, system_prompt: str = None) -> str:
        """Generates text using the local Ollama instance."""
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        
        if system_prompt:
            payload["system"] = system_prompt

        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return response.json().get("response", "")
        except requests.exceptions.ConnectionError:
            return "Error: Could not connect to Ollama. Is it running?"
        except Exception as e:
            return f"Error generating text: {str(e)}"
