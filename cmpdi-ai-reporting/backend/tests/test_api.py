"""
Tests for the FastAPI endpoints — health, config, documents, upload.
SIH26023 Compliance: Phase 4 (System Testing)
"""
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create a FastAPI test client."""
    from main import app
    return TestClient(app)


class TestHealthEndpoint:
    """Test system health check."""

    def test_health_returns_200(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200

    def test_health_has_required_fields(self, client):
        resp = client.get("/api/health")
        data = resp.json()
        assert "status" in data
        assert "vector_chunks" in data
        assert "pdf_count" in data
        assert data["status"] == "online"


class TestConfigEndpoint:
    """Test system configuration endpoint."""

    def test_config_returns_200(self, client):
        resp = client.get("/api/config")
        assert resp.status_code == 200

    def test_config_has_key_status(self, client):
        resp = client.get("/api/config")
        data = resp.json()
        assert "has_groq_key" in data


class TestDocumentsEndpoint:
    """Test document listing."""

    def test_documents_returns_200(self, client):
        resp = client.get("/api/documents")
        assert resp.status_code == 200

    def test_documents_has_list(self, client):
        resp = client.get("/api/documents")
        data = resp.json()
        assert "documents" in data
        assert "total_count" in data
        assert isinstance(data["documents"], list)


class TestQueryEndpoint:
    """Test RAG query endpoint validation."""

    def test_empty_query_returns_400(self, client):
        resp = client.post("/api/query", json={"query": "", "api_key": "fake"})
        assert resp.status_code == 400

    def test_missing_api_key_returns_401(self, client):
        resp = client.post("/api/query", json={"query": "test question"})
        assert resp.status_code == 401


class TestUploadEndpoint:
    """Test document upload validation."""

    def test_unsupported_format_returns_400(self, client):
        """Uploading a .exe file should be rejected."""
        import io
        files = {"file": ("test.exe", io.BytesIO(b"fake content"), "application/octet-stream")}
        resp = client.post("/api/upload-document", files=files)
        assert resp.status_code == 400


class TestPredictiveAnalytics:
    """Test predictive analytics endpoint."""

    def test_valid_prediction_request(self, client):
        resp = client.post("/api/predictive-analytics", json={
            "subsidiary": "MCL",
            "metric": "production",
            "forecast_years": 3
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "projections" in data
        assert "trend" in data
        assert data["subsidiary"] == "MCL"
        assert len(data["projections"]["values"]) == 3

    def test_invalid_subsidiary_returns_400(self, client):
        resp = client.post("/api/predictive-analytics", json={
            "subsidiary": "INVALID",
            "metric": "production"
        })
        assert resp.status_code == 400

    def test_trend_direction_upward(self, client):
        resp = client.post("/api/predictive-analytics", json={
            "subsidiary": "MCL",
            "metric": "production"
        })
        data = resp.json()
        assert data["trend"]["direction"] == "upward"
        assert data["trend"]["cagr_pct"] > 0

    def test_confidence_bounds_exist(self, client):
        resp = client.post("/api/predictive-analytics", json={
            "subsidiary": "SECL",
            "metric": "obr",
            "forecast_years": 2
        })
        data = resp.json()
        assert "confidence_upper" in data
        assert "confidence_lower" in data
        assert len(data["confidence_upper"]) == 2
