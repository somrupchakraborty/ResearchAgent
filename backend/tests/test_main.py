import unittest
from fastapi.testclient import TestClient

# Import the FastAPI app and global engine placeholders
import main as backend_main


class FakeThemeEngine:
    def __init__(self, themes=None, active_limit=3):
        self.themes = themes or []
        self.active_limit = active_limit

    def get_themes(self):
        return self.themes

    def create_theme(self, name, description, keywords, schedule="weekly"):
        theme = {
            "id": f"id_{len(self.themes)+1}",
            "name": name,
            "description": description,
            "keywords": keywords,
            "status": "draft",
            "schedule": schedule,
        }
        self.themes.append(theme)
        return theme

    def update_theme(self, theme_id, updates):
        for t in self.themes:
            if t["id"] == theme_id:
                if updates.get("status") == "active" and t["status"] != "active":
                    active_count = sum(1 for x in self.themes if x["status"] == "active")
                    if active_count >= self.active_limit:
                        raise ValueError("Active theme limit reached (3). Deactivate another theme first.")
                t.update(updates)
                return t
        return None

    def delete_theme(self, theme_id):
        initial_len = len(self.themes)
        self.themes = [t for t in self.themes if t["id"] != theme_id]
        return len(self.themes) < initial_len

    def set_theme_status(self, theme_id, status):
        return self.update_theme(theme_id, {"status": status})


class FakeResearchEngine:
    def __init__(self):
        self.history = []

    def run_research(self, theme):
        run = {
            "id": f"run_{len(self.history)+1}",
            "theme_id": theme["id"],
            "theme_name": theme["name"],
            "timestamp": "2024-01-01T00:00:00",
            "buckets": {"reddit": {"results": [], "summary": "ok"}},
        }
        self.history.append(run)
        return run

    def deep_dive(self, url: str) -> str:
        if url == "raise":
            raise RuntimeError("boom")
        return f"summary for {url}"

    def get_history(self):
        return self.history

    def get_run(self, run_id):
        for r in self.history:
            if r["id"] == run_id:
                return r
        return None


class MainApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create client and then replace global engines with fakes
        cls.client = TestClient(backend_main.app)

    def setUp(self):
        # Fresh fakes for each test
        self.fake_theme_engine = FakeThemeEngine(
            themes=[
                {"id": "t1", "name": "AI Agents", "description": "d", "keywords": ["ai", "agents"], "status": "draft", "schedule": "weekly"},
                {"id": "t2", "name": "Supply Chain", "description": "d2", "keywords": ["scm"], "status": "active", "schedule": "weekly"},
                {"id": "t3", "name": "Robotics", "description": "d3", "keywords": ["robots"], "status": "active", "schedule": "weekly"},
            ]
        )
        self.fake_research_engine = FakeResearchEngine()
        backend_main.theme_engine = self.fake_theme_engine
        backend_main.research_engine = self.fake_research_engine

    # Behaviors to cover:
    # 1) Should return 404 when running research for a non-existent theme
    def test_run_research_theme_not_found(self):
        resp = self.client.post("/research/run", json={"theme_id": "nope"})
        self.assertEqual(resp.status_code, 404)
        self.assertEqual(resp.json()["detail"], "Theme not found")

    # 2) Should return research run for a valid theme
    def test_run_research_success(self):
        resp = self.client.post("/research/run", json={"theme_id": "t1"})
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body["theme_id"], "t1")
        self.assertIn("buckets", body)

    # 3) Should return deep dive summary and 500 on engine exception
    def test_deep_dive_success_and_error(self):
        ok = self.client.post("/research/deep-dive", json={"url": "http://example.com"})
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.json()["summary"], "summary for http://example.com")

        err = self.client.post("/research/deep-dive", json={"url": "raise"})
        self.assertEqual(err.status_code, 500)

    # 4) Should list research history and return 404 for unknown run
    def test_research_history_and_get_run(self):
        # Seed a run
        _ = self.client.post("/research/run", json={"theme_id": "t2"})
        hist = self.client.get("/research/history")
        self.assertEqual(hist.status_code, 200)
        self.assertEqual(len(hist.json()), 1)
        run_id = hist.json()[0]["id"]

        got = self.client.get(f"/research/history/{run_id}")
        self.assertEqual(got.status_code, 200)
        self.assertEqual(got.json()["id"], run_id)

        missing = self.client.get("/research/history/unknown")
        self.assertEqual(missing.status_code, 404)

    # 5) Should create a theme and then be retrievable via /themes
    def test_create_and_list_themes(self):
        resp = self.client.post(
            "/themes/create",
            json={
                "name": "New Theme",
                "description": "desc",
                "keywords": ["k1", "k2"],
                "schedule": "weekly",
            },
        )
        self.assertEqual(resp.status_code, 200)
        created = resp.json()
        self.assertEqual(created["name"], "New Theme")

        lst = self.client.get("/themes")
        self.assertEqual(lst.status_code, 200)
        self.assertTrue(any(t["id"] == created["id"] for t in lst.json()))

    # 6) Should enforce active theme limit when activating a theme
    def test_activate_theme_limit_enforced(self):
        # We currently have 2 active; set limit to 2 to trigger failure
        self.fake_theme_engine.active_limit = 2
        resp = self.client.post("/themes/t1/activate")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Active theme limit reached", resp.json()["detail"])

    # 7) Should activate a theme when within limit
    def test_activate_theme_success(self):
        # Limit 3 means we can activate one more (currently 2 active)
        self.fake_theme_engine.active_limit = 3
        resp = self.client.post("/themes/t1/activate")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "active")

    # 8) Should update a theme and return 404 if theme not found
    def test_update_theme_and_not_found(self):
        upd = self.client.put("/themes/t1", json={"description": "updated"})
        self.assertEqual(upd.status_code, 200)
        self.assertEqual(upd.json()["description"], "updated")

        missing = self.client.put("/themes/not_there", json={"name": "x"})
        self.assertEqual(missing.status_code, 404)

    # 9) Should delete an existing theme and 404 when not found
    def test_delete_theme(self):
        # Delete existing
        ok = self.client.delete("/themes/t3")
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.json()["status"], "deleted")

        # Delete missing
        missing = self.client.delete("/themes/does_not_exist")
        self.assertEqual(missing.status_code, 404)


if __name__ == "__main__":
    unittest.main(verbosity=2)
