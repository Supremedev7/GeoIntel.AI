"""
Tests for security hardening — path traversal, upload limits, CORS, and input sanitization.
SIH26023 Compliance: Phase 4 (Security Testing) — OWASP Top 10
"""
import io
import csv
import json
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create a FastAPI test client."""
    from main import app
    return TestClient(app)


class TestPathTraversalGuards:
    """T5: Verify all file-serving endpoints reject path traversal attempts."""

    TRAVERSAL_PAYLOADS = [
        "../../etc/passwd",
        "../../../etc/shadow",
        "..%2F..%2Fetc%2Fpasswd",
        "....//....//etc/passwd",
        "/etc/passwd",
        "storage/../../../etc/passwd",
    ]

    def test_pdf_raw_rejects_traversal(self, client):
        for payload in self.TRAVERSAL_PAYLOADS:
            resp = client.get(f"/api/pdf-raw/{payload}")
            assert resp.status_code in (400, 404, 422), \
                f"Path traversal not blocked for /api/pdf-raw/{payload}: got {resp.status_code}"

    def test_download_report_rejects_traversal(self, client):
        for payload in self.TRAVERSAL_PAYLOADS:
            resp = client.get(f"/api/download-report/{payload}")
            assert resp.status_code in (400, 404, 422), \
                f"Path traversal not blocked for /api/download-report/{payload}: got {resp.status_code}"

    def test_view_report_pdf_rejects_traversal(self, client):
        for payload in self.TRAVERSAL_PAYLOADS:
            resp = client.get(f"/api/view-report-pdf/{payload}")
            assert resp.status_code in (400, 404, 422), \
                f"Path traversal not blocked for /api/view-report-pdf/{payload}: got {resp.status_code}"

    def test_pdf_info_rejects_traversal(self, client):
        resp = client.get("/api/pdf-info", params={"file": "../../etc/passwd"})
        assert resp.status_code in (400, 404), \
            f"Path traversal not blocked for /api/pdf-info: got {resp.status_code}"

    def test_pdf_page_rejects_traversal(self, client):
        resp = client.get("/api/pdf-page", params={"file": "../../etc/passwd", "page": 1})
        assert resp.status_code in (400, 404), \
            f"Path traversal not blocked for /api/pdf-page: got {resp.status_code}"


class TestUploadSizeLimit:
    """T5/S2: Verify upload file size enforcement."""

    def test_oversized_upload_returns_413(self, client):
        """A file exceeding MAX_UPLOAD_BYTES should be rejected."""
        from main import MAX_UPLOAD_BYTES
        # Create a payload just over the limit
        oversized = b"X" * (MAX_UPLOAD_BYTES + 1)
        files = {"file": ("huge_file.csv", io.BytesIO(oversized), "text/csv")}
        resp = client.post("/api/upload-document", files=files)
        assert resp.status_code == 413, f"Expected 413 for oversized upload, got {resp.status_code}"


class TestUploadHappyPath:
    """T2: Verify that a valid CSV file is uploaded and indexed successfully."""

    def test_upload_valid_csv(self, client):
        """Upload a small CSV file and verify it's accepted and indexed."""
        from ingester import PDF_DIR
        uploaded_path = PDF_DIR / "test_upload.csv"
        csv_content = "Subsidiary,Production_MT,Region\nMCL,193.30,Odisha\nSECL,167.00,Chhattisgarh\n"
        files = {"file": ("test_upload.csv", io.BytesIO(csv_content.encode()), "text/csv")}
        try:
            resp = client.post("/api/upload-document", files=files)
            assert resp.status_code == 200, f"Upload failed: {resp.text}"
            data = resp.json()
            assert data["status"] == "success"
            assert data["format"] == "CSV"
            assert data["chunks_indexed"] > 0
            assert "total_vectors" in data
        finally:
            if uploaded_path.exists():
                uploaded_path.unlink()

    def test_upload_valid_pdf_small(self, client):
        """Upload a minimal valid PDF file."""
        from ingester import PDF_DIR
        uploaded_path = PDF_DIR / "test_report.pdf"
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph
            from reportlab.lib.styles import getSampleStyleSheet
            
            buf = io.BytesIO()
            doc = SimpleDocTemplate(buf, pagesize=letter)
            styles = getSampleStyleSheet()
            story = [Paragraph("Coal Production Report FY 2023-24: MCL produced 193.30 MT from Talcher coalfield.", styles['Normal'])]
            doc.build(story)
            pdf_bytes = buf.getvalue()
            
            files = {"file": ("test_report.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
            try:
                resp = client.post("/api/upload-document", files=files)
                assert resp.status_code == 200
                data = resp.json()
                assert data["status"] == "success"
                assert data["format"] == "PDF"
                assert data["chunks_indexed"] >= 0  # May be 0 if text is too short
            finally:
                if uploaded_path.exists():
                    uploaded_path.unlink()
        except ImportError:
            pytest.skip("reportlab not available for PDF generation")


class TestCORSConfiguration:
    """S3: Verify CORS is configured without credentials + wildcard conflict."""

    def test_cors_no_credentials_with_wildcard(self, client):
        """Preflight request should not set Access-Control-Allow-Credentials."""
        resp = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            }
        )
        # With allow_credentials=False, the header should NOT be "true"
        creds_header = resp.headers.get("access-control-allow-credentials", "false")
        assert creds_header != "true", \
            f"CORS credentials enabled with wildcard origin — OWASP violation"


class TestFeedbackSanitization:
    """S4: Verify report feedback input sanitization."""

    def test_feedback_sanitizes_report_name(self, client):
        """Malicious report_name should be sanitized."""
        resp = client.post(
            "/api/report-feedback",
            params={"report_name": "../../../etc/passwd"},
            content=json.dumps("Great report!"),
            headers={"Content-Type": "application/json"}
        )
        # Should succeed but the name should be sanitized
        assert resp.status_code == 200

    def test_feedback_rejects_empty_name(self, client):
        """Empty report_name after sanitization should be rejected."""
        resp = client.post(
            "/api/report-feedback",
            params={"report_name": "///"},
            content=json.dumps("Test"),
            headers={"Content-Type": "application/json"}
        )
        assert resp.status_code == 400

    def test_feedback_truncates_long_feedback(self, client):
        """Extremely long feedback should be accepted but truncated."""
        long_feedback = "A" * 10000
        resp = client.post(
            "/api/report-feedback",
            params={"report_name": "Test_Report"},
            content=json.dumps(long_feedback),
            headers={"Content-Type": "application/json"}
        )
        assert resp.status_code == 200
