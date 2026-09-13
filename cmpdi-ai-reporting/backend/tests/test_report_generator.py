"""
Tests for the Report Generator — archetypes, sanitization, structure.
SIH26023 Compliance: Phase 4 (System Testing)
"""
import pytest


class TestReportArchetypes:
    """Test report archetype definitions."""

    def test_archetypes_exist(self):
        from report_generator import REPORT_ARCHETYPES
        assert isinstance(REPORT_ARCHETYPES, dict)
        assert len(REPORT_ARCHETYPES) >= 4

    def test_required_archetypes_present(self):
        from report_generator import REPORT_ARCHETYPES
        required = ["comprehensive_audit", "production_obr", "geological_exploration", "cbm_clean_coal"]
        for archetype in required:
            assert archetype in REPORT_ARCHETYPES, f"Missing archetype: {archetype}"

    def test_archetype_has_required_fields(self):
        from report_generator import REPORT_ARCHETYPES
        for name, arch in REPORT_ARCHETYPES.items():
            assert "title" in arch, f"Archetype {name} missing 'title'"
            assert "search_terms" in arch, f"Archetype {name} missing 'search_terms'"
            assert "focus" in arch, f"Archetype {name} missing 'focus'"
            assert "bullets" in arch, f"Archetype {name} missing 'bullets'"


class TestSubsidiaryData:
    """Test subsidiary production data."""

    def test_all_subsidiaries_present(self):
        from report_generator import SUBSIDIARY_DATA
        required_subs = ["MCL", "SECL", "NCL", "CCL", "WCL", "BCCL", "ECL", "CMPDI"]
        for sub in required_subs:
            assert sub in SUBSIDIARY_DATA, f"Missing subsidiary: {sub}"

    def test_subsidiary_has_required_fields(self):
        from report_generator import SUBSIDIARY_DATA
        required_fields = ["name", "oc", "ug", "total", "target", "growth", "basin", "sr"]
        for sub, data in SUBSIDIARY_DATA.items():
            for field in required_fields:
                assert field in data, f"Subsidiary {sub} missing field: {field}"

    def test_mcl_production_values(self):
        from report_generator import SUBSIDIARY_DATA
        mcl = SUBSIDIARY_DATA["MCL"]
        assert mcl["total"] == 193.30
        assert mcl["oc"] == 181.50

    def test_subsidiary_data_centralized_consistency(self):
        """Q2: Verify single source of truth consistency between cross-sectional and historical data."""
        from subsidiary_data import SUBSIDIARY_DATA, SUBSIDIARY_STATS, HISTORICAL_DATA

        # Producing subsidiaries count
        assert len(SUBSIDIARY_STATS) == 7
        assert len(SUBSIDIARY_DATA) == 8  # 7 producing + CMPDI

        # Verify historical latest year aligns with cross-sectional total
        for stat in SUBSIDIARY_STATS:
            code = stat["name"]
            assert code in HISTORICAL_DATA, f"{code} missing from HISTORICAL_DATA"
            latest_hist = HISTORICAL_DATA[code]["production"][-1]
            cross_total = SUBSIDIARY_DATA[code]["total"]
            assert abs(latest_hist - cross_total) < 0.01, \
                f"Data mismatch for {code}: historical latest={latest_hist}, total={cross_total}"


class TestSanitization:
    """Test ReportLab text sanitization."""

    def test_sanitize_unicode_hyphens(self):
        from report_generator import sanitize_for_reportlab
        text = "coal–mining‐operations—2024"
        sanitized = sanitize_for_reportlab(text)
        assert "–" not in sanitized  # En dash should be replaced
        assert "‐" not in sanitized  # Hyphen should be replaced
        assert "—" not in sanitized  # Em dash should be replaced

    def test_sanitize_html_entities(self):
        from report_generator import sanitize_for_reportlab
        text = "a < b & c > d"
        sanitized = sanitize_for_reportlab(text)
        assert "&lt;" in sanitized
        assert "&amp;" in sanitized
        assert "&gt;" in sanitized

    def test_sanitize_bold_markdown(self):
        from report_generator import sanitize_for_reportlab
        text = "**Important** note"
        sanitized = sanitize_for_reportlab(text)
        assert "<b>Important</b>" in sanitized

    def test_sanitize_zero_width_space(self):
        from report_generator import sanitize_for_reportlab
        text = "coal\u200bmining"  # Zero-width space
        sanitized = sanitize_for_reportlab(text)
        assert "\u200b" not in sanitized


class TestReportStructure:
    """Test dynamic report structure generation."""

    def test_default_structure_has_required_sections(self):
        from report_generator import _generate_dynamic_report_structure
        structure = _generate_dynamic_report_structure([], "")
        section_ids = [s["id"] for s in structure]
        assert "executive_summary" in section_ids
        assert "technical_evaluation" in section_ids
        assert "recommendations" in section_ids

    def test_theme_adds_sections(self):
        from report_generator import _generate_dynamic_report_structure
        structure = _generate_dynamic_report_structure(["production", "safety"], "")
        section_ids = [s["id"] for s in structure]
        assert "production_performance" in section_ids
        assert "safety_review" in section_ids

    def test_custom_notes_adds_directives_section(self):
        from report_generator import _generate_dynamic_report_structure
        structure = _generate_dynamic_report_structure([], "Focus on Talcher OBR benchmarks")
        section_ids = [s["id"] for s in structure]
        assert "user_directives" in section_ids


class TestReportGenerationMocked:
    """T6: End-to-end report generation with mocked LLM and context retrieval."""

    def test_generate_docx_and_pdf_direct(self, tmp_path):
        from report_generator import generate_docx_from_markdown, generate_pdf_from_markdown

        sample_md = (
            "# Executive Summary\n\n"
            "Mahanadi Coalfields achieved **193.30 MT** total raw coal production in FY 2023-24.\n\n"
            "## Key Findings\n\n"
            "- Opencast mining contributed 181.50 MT.\n"
            "- Underground mining contributed 11.80 MT.\n"
            "- Stripping ratio held steady at 1.18 m³/t.\n\n"
            "| Subsidiary | Opencast | Underground | Total |\n"
            "| :--- | :---: | :---: | :---: |\n"
            "| MCL | 181.50 | 11.80 | 193.30 |\n"
        )

        docx_out = tmp_path / "test_report.docx"
        pdf_out = tmp_path / "test_report.pdf"

        generate_docx_from_markdown(sample_md, docx_out, "MCL", "FY 2023-24")
        assert docx_out.exists()
        assert docx_out.stat().st_size > 500

        generate_pdf_from_markdown(sample_md, pdf_out, "MCL", "FY 2023-24")
        assert pdf_out.exists()
        assert pdf_out.stat().st_size > 500

    def test_build_structured_report_mocked(self):
        from unittest.mock import patch, MagicMock
        from pathlib import Path
        from report_generator import build_structured_report, REPORTS_DIR

        mock_chunks = [
            {
                "text": "MCL production reached 193.3 MT with significant stripping ratio stability across Talcher basin.",
                "source": "MCL_Annual_Report.pdf",
                "page_number": 4,
                "bbox": [50.0, 50.0, 400.0, 80.0]
            }
        ]

        created_files = []

        with patch("report_generator.get_groq_client", return_value=(MagicMock(), "mock-key")), \
             patch("report_generator.get_best_model_for_client", return_value="llama-3.3-70b-versatile"), \
             patch("report_generator.engine.query", return_value=mock_chunks), \
             patch("report_generator.execute_groq_resilient_chat", return_value=(
                 "## 1. Executive Summary & Directive Objectives\n"
                 "MCL demonstrated record output of 193.30 MT in FY 2023-24.\n\n"
                 "## 2. Technical Evaluation & Geological Grounding\n"
                 "Talcher coal basin exploration verified extensive Barakar seam reserves.\n\n"
                 "## 3. Operational Analysis & Strategic Recommendations\n"
                 "Continue modernization of dispatch rakes.",
                 "llama-3.3-70b-versatile"
             )):

            result = build_structured_report({
                "report_type": "production_obr",
                "subsidiary": "MCL",
                "timeframe": "FY 2023-24",
                "tone": "Formal Executive Brief"
            })

            try:
                assert "topic" in result
                assert "files" in result
                assert "markdown" in result["files"]
                assert "docx" in result["files"]
                assert "pdf" in result["files"]

                for fmt in ["markdown", "docx", "pdf"]:
                    file_path = Path(result["files"][fmt]["path"])
                    created_files.append(file_path)
                    assert file_path.exists(), f"Expected {fmt} file at {file_path}"
                    assert file_path.stat().st_size > 0, f"Expected non-empty {fmt} file"

                assert "MCL" in result["preview_text"]
                assert "Factual Audit" in result["preview_text"]
            finally:
                # Cleanup generated test reports
                for f in created_files:
                    try:
                        if f.exists():
                            f.unlink()
                    except Exception:
                        pass
