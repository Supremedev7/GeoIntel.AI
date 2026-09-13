"""
Tests for scraper module — network error handling, parsing, file download.
SIH26023 Compliance: Phase 4 (System Testing) — T3
Uses httpx.MockTransport for deterministic offline testing.
"""
import io
import json
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

import httpx
import pytest


class TestPurgeSyntheticPdfs:
    """Test synthetic PDF cleanup logic."""

    def test_purge_removes_small_files(self, tmp_path):
        """Files under 20KB should be purged."""
        from scraper import purge_synthetic_pdfs, STORAGE_DIR

        # Create small mock PDFs in a temp dir
        small_file = tmp_path / "mock_small.pdf"
        small_file.write_bytes(b"X" * 5000)  # 5KB — should be purged

        large_file = tmp_path / "real_document.pdf"
        large_file.write_bytes(b"X" * 25000)  # 25KB — should survive

        with patch("scraper.STORAGE_DIR", tmp_path):
            count = purge_synthetic_pdfs()

        assert count == 1, f"Expected 1 file purged, got {count}"
        assert not small_file.exists(), "Small file should have been deleted"
        assert large_file.exists(), "Large file should have survived"

    def test_purge_handles_empty_directory(self, tmp_path):
        """Purge on empty directory should return 0."""
        from scraper import purge_synthetic_pdfs

        with patch("scraper.STORAGE_DIR", tmp_path):
            count = purge_synthetic_pdfs()

        assert count == 0


class TestDownloadPdf:
    """Test PDF download with mocked HTTP."""

    def test_download_success(self, tmp_path):
        """Successful download should write file to disk."""
        from scraper import download_pdf

        pdf_content = b"%PDF-1.4 " + b"X" * 10000  # Fake valid PDF > 5KB

        def mock_handler(request):
            return httpx.Response(200, content=pdf_content)

        transport = httpx.MockTransport(mock_handler)
        with patch("scraper.STORAGE_DIR", tmp_path):
            with patch("httpx.Client") as MockClient:
                mock_client = MagicMock()
                mock_client.__enter__ = MagicMock(return_value=mock_client)
                mock_client.__exit__ = MagicMock(return_value=False)
                mock_client.get.return_value = httpx.Response(200, content=pdf_content)
                MockClient.return_value = mock_client

                result = download_pdf("https://example.com/test.pdf", "test_download.pdf")

        assert result is True

    def test_download_failure_returns_false(self, tmp_path):
        """Failed download (404) should return False."""
        from scraper import download_pdf

        with patch("scraper.STORAGE_DIR", tmp_path):
            with patch("httpx.Client") as MockClient:
                mock_client = MagicMock()
                mock_client.__enter__ = MagicMock(return_value=mock_client)
                mock_client.__exit__ = MagicMock(return_value=False)
                mock_client.get.return_value = httpx.Response(404, content=b"")
                MockClient.return_value = mock_client

                result = download_pdf("https://example.com/missing.pdf", "missing.pdf")

        assert result is False

    def test_download_skips_cached_file(self, tmp_path):
        """If file already exists and is large enough, download is skipped."""
        from scraper import download_pdf

        # Pre-create a cached file > 10KB
        cached = tmp_path / "cached.pdf"
        cached.write_bytes(b"X" * 15000)

        with patch("scraper.STORAGE_DIR", tmp_path):
            result = download_pdf("https://example.com/cached.pdf", "cached.pdf")

        assert result is True  # Should return True without downloading


class TestAddLog:
    """Test log management."""

    def test_add_log_appends_entry(self):
        from scraper import add_log, SCRAPE_LOGS
        initial_len = len(SCRAPE_LOGS)
        add_log("Test log entry", "INFO")
        assert len(SCRAPE_LOGS) >= initial_len + 1
        assert SCRAPE_LOGS[-1]["message"] == "Test log entry"
        assert SCRAPE_LOGS[-1]["level"] == "INFO"

    def test_log_rotation_caps_at_300(self):
        from scraper import add_log, SCRAPE_LOGS
        # Fill logs beyond 300
        for i in range(350):
            add_log(f"Entry {i}")
        assert len(SCRAPE_LOGS) <= 300, f"Logs should be capped at 300, got {len(SCRAPE_LOGS)}"


class TestTargetUrls:
    """Test configuration integrity."""

    def test_target_urls_are_government_domains(self):
        from scraper import TARGET_INDEX_URLS
        for entry in TARGET_INDEX_URLS:
            url = entry["url"]
            assert "coal.gov.in" in url or "coal.nic.in" in url, \
                f"URL {url} is not an official government domain"

    def test_direct_pdfs_have_valid_names(self):
        from scraper import DIRECT_GOVT_PDFS
        for entry in DIRECT_GOVT_PDFS:
            assert entry["name"].endswith(".pdf"), f"PDF name should end with .pdf: {entry['name']}"
            assert "url" in entry and entry["url"].startswith("https://"), \
                f"PDF URL should be HTTPS: {entry.get('url', 'MISSING')}"
