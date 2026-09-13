"""
Tests for the RAG Engine — query expansion, model failover, text cleaning.
SIH26023 Compliance: Phase 4 (System Testing)
"""
import re
import pytest


class TestQueryExpansion:
    """Test geological domain query expansion."""

    def test_expand_query_exists(self):
        from rag_engine import _expand_query_geological
        assert callable(_expand_query_geological)

    def test_short_query_gets_expanded(self):
        from rag_engine import _expand_query_geological
        expanded = _expand_query_geological("stripping ratio")
        # Should return multiple domain-expanded query variations
        assert isinstance(expanded, list)
        assert len(expanded) > 1
        assert any("overburden" in q or "waste" in q for q in expanded)

    def test_geological_term_expansion(self):
        from rag_engine import _expand_query_geological
        expanded = _expand_query_geological("Barakar formation")
        assert isinstance(expanded, list)
        expanded_lower = [q.lower() for q in expanded]
        # Should recognize Barakar as geological and preserve/expand it
        assert any("barakar" in q for q in expanded_lower)


class TestModelPriority:
    """Test model selection and priority logic."""

    def test_pick_model_prefers_llama70b(self):
        from rag_engine import pick_model
        available = ["gemma2-9b-it", "llama-3.3-70b-versatile", "llama3-8b-8192"]
        chosen = pick_model(available)
        assert chosen == "llama-3.3-70b-versatile"

    def test_pick_model_avoids_guard_models(self):
        from rag_engine import pick_model
        available = ["llama-guard-3-8b", "llama3-8b-8192"]
        chosen = pick_model(available)
        assert "guard" not in chosen.lower()

    def test_pick_model_handles_empty_list(self):
        from rag_engine import pick_model
        chosen = pick_model([])
        assert chosen == "llama-3.1-8b-instant"  # Default fallback

    def test_preferred_models_list_not_empty(self):
        from rag_engine import PREFERRED_MODELS
        assert len(PREFERRED_MODELS) >= 10


class TestTextCleaning:
    """Test think-tag stripping and text cleanup."""

    def test_think_tag_pattern(self):
        """Verify the think-tag regex pattern works."""
        text = "<think>Internal reasoning here</think>The actual answer is 42."
        cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
        assert cleaned == "The actual answer is 42."

    def test_nested_think_tags(self):
        text = "<think>Step 1\nStep 2\nStep 3</think>\n\nThe coal production was 193.30 MT."
        cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
        assert "coal production" in cleaned
        assert "<think>" not in cleaned


class TestStopwords:
    """Test semantic stopword filtering."""

    def test_stopwords_loaded(self):
        from rag_engine import ENGLISH_SEMANTIC_STOPWORDS
        assert isinstance(ENGLISH_SEMANTIC_STOPWORDS, set)
        assert len(ENGLISH_SEMANTIC_STOPWORDS) > 20
        assert "that" in ENGLISH_SEMANTIC_STOPWORDS
        assert "and" in ENGLISH_SEMANTIC_STOPWORDS
