"""
Execution-based smoke test for the Shop The Look FastAPI backend.

Proves the app boots and serves requests with Pinecone **mocked** — no live
Pinecone connection and no API key required (per the repo AGENTS.md rule that
Pinecone calls are mocked or gated when no key is present in CI).

`api/deps.py` constructs `Pinecone(...)` and `pc.Index(...)` at import time, and
`api/config.py` reads several env vars at import time, so we set dummy env and
patch `pinecone.Pinecone` before importing the app.

To run against REAL Pinecone instead, see TESTING.md ("run against real
Pinecone"): export real PINECONE_* env vars and delete the patch.
"""
import os
from unittest import mock

# Dummy env consumed at import time by api/config.py. Never a real key.
os.environ.setdefault("PINECONE_API_KEY", "pclocal-ci-dummy-key")
os.environ.setdefault("PINECONE_INDEX_NAME", "ci-dummy-index")
os.environ.setdefault("PINECONE_TOP_K", "5")


def test_app_boots_and_serves_root_with_mocked_pinecone():
    with mock.patch("pinecone.Pinecone") as MockPinecone:
        MockPinecone.return_value.Index.return_value = mock.MagicMock()

        from api.index import app
        from fastapi.testclient import TestClient

        client = TestClient(app)
        resp = client.get("/api")

        assert resp.status_code == 200, resp.text
        assert "Shop The Look" in resp.json()["message"]
