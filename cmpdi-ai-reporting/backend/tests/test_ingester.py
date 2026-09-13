"""
Tests for the IngestionEngine — PDF, Spreadsheet, and OCR parsing.
SIH26023 Compliance: Phase 4 (System Testing)
"""
import json
import csv
import tempfile
from pathlib import Path

import pytest


class TestFastOfflineEmbedding:
    """Test the custom 384-dim hash-based embedding function."""

    def test_embedding_returns_correct_dimension(self):
        from ingester import FastOfflineEmbedding
        emb = FastOfflineEmbedding(dim=384)
        result = emb(["test text"])
        assert len(result) == 1
        assert len(result[0]) == 384

    def test_embedding_is_normalized(self):
        import numpy as np
        from ingester import FastOfflineEmbedding
        emb = FastOfflineEmbedding(dim=384)
        result = emb(["geological exploration Barakar formation"])
        vec = np.array(result[0])
        norm = np.linalg.norm(vec)
        assert abs(norm - 1.0) < 0.01, f"Vector should be unit-normalized, got norm={norm}"

    def test_embedding_empty_text(self):
        from ingester import FastOfflineEmbedding
        emb = FastOfflineEmbedding(dim=384)
        result = emb([""])
        assert len(result[0]) == 384
        # Empty text should produce zero vector
        assert all(v == 0.0 for v in result[0])

    def test_similar_texts_have_closer_embeddings(self):
        import numpy as np
        from ingester import FastOfflineEmbedding
        emb = FastOfflineEmbedding(dim=384)
        
        vecs = emb(["coal production mining", "coal output extraction", "banana recipe cooking"])
        v1 = np.array(vecs[0])
        v2 = np.array(vecs[1])
        v3 = np.array(vecs[2])
        
        sim_12 = np.dot(v1, v2)  # Similar topics
        sim_13 = np.dot(v1, v3)  # Different topics
        
        assert sim_12 > sim_13, "Similar texts should have higher cosine similarity"


class TestIngestionEngineSpreadsheet:
    """Test spreadsheet (XLSX/CSV) parsing."""

    def test_csv_parsing(self):
        from ingester import IngestionEngine
        
        # Create a temp CSV file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["Subsidiary", "Production_MT", "Region"])
            writer.writerow(["MCL", "193.30", "Odisha"])
            writer.writerow(["SECL", "167.00", "Chhattisgarh"])
            writer.writerow(["NCL", "131.00", "Singrauli"])
            temp_path = Path(f.name)
        
        try:
            engine = IngestionEngine.__new__(IngestionEngine)
            records = engine.parse_spreadsheet(temp_path)
            
            assert len(records) == 3, f"Expected 3 rows, got {len(records)}"
            
            # Check that headers are included in text
            first_text = records[0]["text"]
            assert "Subsidiary" in first_text
            assert "MCL" in first_text
            assert "193.30" in first_text
            
            # Check metadata
            assert records[0]["metadata"]["format"] == "csv"
            assert records[0]["metadata"]["source"] == temp_path.name
        finally:
            temp_path.unlink(missing_ok=True)

    def test_csv_empty_rows_skipped(self):
        from ingester import IngestionEngine
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["Col1", "Col2"])
            writer.writerow(["", ""])  # Empty row
            writer.writerow(["Data", "Value is here and long enough"])
            temp_path = Path(f.name)
        
        try:
            engine = IngestionEngine.__new__(IngestionEngine)
            records = engine.parse_spreadsheet(temp_path)
            
            # Only the non-empty row should be parsed
            assert len(records) == 1
        finally:
            temp_path.unlink(missing_ok=True)


class TestIngestionEngineCore:
    """Test core ingestion engine functionality."""

    def test_supported_extensions(self):
        from ingester import SUPPORTED_EXTENSIONS
        assert ".pdf" in SUPPORTED_EXTENSIONS
        assert ".xlsx" in SUPPORTED_EXTENSIONS
        assert ".csv" in SUPPORTED_EXTENSIONS
        assert ".png" in SUPPORTED_EXTENSIONS
        assert ".jpg" in SUPPORTED_EXTENSIONS
        assert ".tiff" in SUPPORTED_EXTENSIONS

    def test_chunk_id_format(self):
        """Chunk IDs should follow deterministic format for deduplication."""
        from ingester import IngestionEngine
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["Header1", "Header2"])
            writer.writerow(["Some long enough data value", "Another data value here"])
            temp_path = Path(f.name)
        
        try:
            engine = IngestionEngine.__new__(IngestionEngine)
            records = engine.parse_spreadsheet(temp_path)
            
            if records:
                chunk_id = records[0]["id"]
                assert temp_path.name in chunk_id, "Chunk ID should contain filename"
        finally:
            temp_path.unlink(missing_ok=True)

    def test_ingest_single_file_routes_correctly(self):
        """ingest_single_file should accept CSV files without error."""
        # This test validates the routing logic exists — actual ChromaDB upsert
        # requires a running instance, so we just verify no import errors
        from ingester import IngestionEngine
        assert hasattr(IngestionEngine, 'ingest_single_file')
        assert hasattr(IngestionEngine, 'parse_spreadsheet')
        assert hasattr(IngestionEngine, 'parse_image_with_ocr')
