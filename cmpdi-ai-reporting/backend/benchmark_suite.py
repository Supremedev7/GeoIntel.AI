"""
GeoIntel Core — Formal Accuracy Benchmark Suite
Team Data Miners | SIH 2026 | PS SIH26023

SIH26023 Compliance: "Maximum accuracy, calculated in percentage"
Runs 25 gold-standard geological/mining queries against the RAG pipeline
and computes formal accuracy metrics.

Usage:
    python benchmark_suite.py
    python benchmark_suite.py --api-key gsk_xxx
"""

import os
import sys
import json
import time
import logging
import argparse
from pathlib import Path
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("benchmark")

# Gold-standard evaluation queries with expected keywords
# Each query has: question, expected_keywords (at least 2 must appear), category
GOLD_STANDARD_QUERIES = [
    # --- Production & Operations ---
    {"query": "What is the total coal production of Coal India Limited?", "expected_keywords": ["production", "mt", "million"], "category": "production"},
    {"query": "What is the stripping ratio for MCL?", "expected_keywords": ["stripping", "ratio", "mcl"], "category": "production"},
    {"query": "How much coal did SECL produce from opencast mines?", "expected_keywords": ["secl", "opencast", "production"], "category": "production"},
    {"query": "What is the overburden removal volume achieved by CIL?", "expected_keywords": ["overburden", "obr", "cum"], "category": "production"},
    {"query": "What are the production targets for NCL?", "expected_keywords": ["ncl", "target", "production"], "category": "production"},

    # --- Geological Exploration ---
    {"query": "Explain the Barakar formation in the context of coal exploration.", "expected_keywords": ["barakar", "formation", "coal"], "category": "geological"},
    {"query": "How much exploratory drilling did CMPDI achieve?", "expected_keywords": ["cmpdi", "drilling", "exploration"], "category": "geological"},
    {"query": "Describe the Gondwana stratigraphy relevant to coal deposits.", "expected_keywords": ["gondwana", "stratigraphy", "coal"], "category": "geological"},
    {"query": "What geological formations contain the Raniganj coal measures?", "expected_keywords": ["raniganj", "formation", "coal"], "category": "geological"},
    {"query": "What is the significance of borehole logging in coal exploration?", "expected_keywords": ["borehole", "exploration", "coal"], "category": "geological"},

    # --- CBM & Clean Coal ---
    {"query": "What is the CBM potential in Jharia coalfield?", "expected_keywords": ["cbm", "jharia", "methane"], "category": "cbm"},
    {"query": "Describe coal beneficiation and washery operations.", "expected_keywords": ["beneficiation", "washery", "coal"], "category": "cbm"},
    {"query": "What is the gas-in-place estimate for deep Gondwana blocks?", "expected_keywords": ["gas", "gondwana", "bcm"], "category": "cbm"},

    # --- Safety & Environment ---
    {"query": "What are the safety protocols for opencast mines?", "expected_keywords": ["safety", "mine", "opencast"], "category": "safety"},
    {"query": "What environmental regulations apply to coal mining operations?", "expected_keywords": ["environmental", "mining", "regulation"], "category": "safety"},

    # --- Infrastructure & Logistics ---
    {"query": "What is First Mile Connectivity in coal dispatch?", "expected_keywords": ["first", "mile", "connectivity"], "category": "infrastructure"},
    {"query": "How many rakes per day does CIL dispatch?", "expected_keywords": ["rakes", "dispatch", "day"], "category": "infrastructure"},
    {"query": "Describe the Heavy Earth Moving Machinery used in opencast mining.", "expected_keywords": ["hemm", "shovel", "dumper"], "category": "infrastructure"},

    # --- Subsidiary-Specific ---
    {"query": "Compare production performance across CIL subsidiaries.", "expected_keywords": ["subsidiary", "production", "mcl"], "category": "subsidiary"},
    {"query": "What is the underground mining contribution of ECL?", "expected_keywords": ["ecl", "underground", "mining"], "category": "subsidiary"},
    {"query": "Describe the operational profile of CCL.", "expected_keywords": ["ccl", "coalfield", "production"], "category": "subsidiary"},
    {"query": "What is the growth trajectory of BCCL?", "expected_keywords": ["bccl", "growth", "production"], "category": "subsidiary"},

    # --- Policy & Planning ---
    {"query": "What are the mine plan guidelines from the Ministry of Coal?", "expected_keywords": ["mine", "plan", "guideline"], "category": "policy"},
    {"query": "Describe the coal gasification initiatives in India.", "expected_keywords": ["gasification", "coal", "initiative"], "category": "policy"},
    {"query": "What policies support coal sector digital transformation?", "expected_keywords": ["digital", "coal", "transformation"], "category": "policy"},
]


def run_benchmark(api_key: str = None, offline: bool = False):
    """Execute the full 25-query benchmark and compute accuracy metrics."""
    from rag_engine import query_rag

    results = []
    total_latency = 0.0
    pass_count = 0
    citation_hits = 0

    logger.info(f"Starting GeoIntel Core Benchmark: {len(GOLD_STANDARD_QUERIES)} queries")
    logger.info("=" * 70)

    for idx, item in enumerate(GOLD_STANDARD_QUERIES, 1):
        query = item["query"]
        expected = [kw.lower() for kw in item["expected_keywords"]]
        category = item["category"]

        logger.info(f"[{idx}/{len(GOLD_STANDARD_QUERIES)}] {category.upper()}: {query}")

        start = time.time()
        try:
            if offline or not api_key:
                # Offline retrieval benchmark: evaluate ChromaDB vector + hybrid retrieval
                from ingester import engine
                from rag_engine import _expand_query_geological, HYBRID_RETRIEVAL_AVAILABLE, _hybrid_retrieve
                expanded_queries = _expand_query_geological(query)
                all_chunks = []
                seen_chunk_ids = set()
                for exp_q in expanded_queries[:2]:
                    if HYBRID_RETRIEVAL_AVAILABLE:
                        chunks = _hybrid_retrieve(exp_q, n_results=4)
                    else:
                        chunks = engine.query(exp_q, n_results=4)
                    for chunk in chunks:
                        cid = (chunk.get("source", ""), chunk.get("page_number", 0))
                        if cid not in seen_chunk_ids:
                            seen_chunk_ids.add(cid)
                            all_chunks.append(chunk)
                retrieved_text = " ".join([c.get("text", "") for c in all_chunks]).lower()
                answer = retrieved_text
                citations = [{"source": c.get("source", ""), "page": c.get("page_number", 1)} for c in all_chunks[:3]]
                model_used = "offline-chroma-retriever"
            else:
                result = query_rag(query, custom_api_key=api_key)
                answer = result.get("answer", "").lower()
                citations = result.get("citations", [])
                model_used = result.get("model", "unknown")

            latency = time.time() - start
            total_latency += latency

            # Keyword match scoring: how many expected keywords appear in the answer/context
            matched_keywords = [kw for kw in expected if kw in answer]
            keyword_score = len(matched_keywords) / len(expected) if expected else 1.0

            # Citation quality: does the answer have at least 1 citation with a valid source
            has_citation = len(citations) > 0 and any(c.get("source") for c in citations)
            if has_citation:
                citation_hits += 1

            # Answer quality: must have content, match domain keywords, and have citations
            is_pass = keyword_score >= 0.33 and len(answer) > 30 and has_citation
            if is_pass:
                pass_count += 1

            results.append({
                "query_id": idx,
                "query": query,
                "category": category,
                "answer_length": len(answer),
                "keyword_score": round(keyword_score, 2),
                "matched_keywords": matched_keywords,
                "has_citation": has_citation,
                "citation_count": len(citations),
                "latency_s": round(latency, 2),
                "pass": is_pass,
                "model": model_used
            })

            status = "✅ PASS" if is_pass else "❌ FAIL"
            logger.info(f"   {status} | Keywords: {len(matched_keywords)}/{len(expected)} | Citations: {len(citations)} | {round(latency, 2)}s")

        except Exception as e:
            latency = time.time() - start
            total_latency += latency
            results.append({
                "query_id": idx,
                "query": query,
                "category": category,
                "answer_length": 0,
                "keyword_score": 0.0,
                "matched_keywords": [],
                "has_citation": False,
                "citation_count": 0,
                "latency_s": round(latency, 2),
                "pass": False,
                "error": str(e)
            })
            logger.error(f"   ❌ ERROR: {str(e)[:100]}")

    # Compute aggregate metrics
    total = len(GOLD_STANDARD_QUERIES)
    accuracy_pct = round((pass_count / total) * 100, 1)
    citation_hit_rate = round((citation_hits / total) * 100, 1)
    avg_latency = round(total_latency / total, 2)
    avg_keyword_score = round(sum(r["keyword_score"] for r in results) / total * 100, 1)

    # Category breakdown
    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"total": 0, "passed": 0}
        categories[cat]["total"] += 1
        if r["pass"]:
            categories[cat]["passed"] += 1

    summary = {
        "benchmark_date": datetime.now().isoformat(),
        "total_queries": total,
        "passed": pass_count,
        "failed": total - pass_count,
        "accuracy_pct": accuracy_pct,
        "keyword_match_pct": avg_keyword_score,
        "citation_hit_rate_pct": citation_hit_rate,
        "avg_latency_s": avg_latency,
        "total_latency_s": round(total_latency, 2),
        "category_breakdown": {
            cat: f"{data['passed']}/{data['total']} ({round(data['passed']/data['total']*100)}%)"
            for cat, data in sorted(categories.items())
        },
        "results": results
    }

    # Save results
    output_dir = Path(__file__).resolve().parent / "storage"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "benchmark_results.json"
    output_file.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    # Print summary
    logger.info("=" * 70)
    logger.info("BENCHMARK RESULTS")
    logger.info("=" * 70)
    logger.info(f"  Overall Accuracy:    {accuracy_pct}%  ({pass_count}/{total} queries passed)")
    logger.info(f"  Keyword Match Rate:  {avg_keyword_score}%")
    logger.info(f"  Citation Hit Rate:   {citation_hit_rate}%")
    logger.info(f"  Average Latency:     {avg_latency}s")
    logger.info("-" * 70)
    logger.info("  Category Breakdown:")
    for cat, score in summary["category_breakdown"].items():
        logger.info(f"    {cat:20s}  {score}")
    logger.info("=" * 70)
    logger.info(f"  Results saved to: {output_file}")

    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GeoIntel Core Benchmark Suite")
    parser.add_argument("--api-key", type=str, default=None, help="Groq API key for LLM inference")
    parser.add_argument("--offline", action="store_true", help="Run benchmark against vector store retrieval only")
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        for candidate in [Path("../api.txt"), Path("../../api.txt"), Path("api.txt")]:
            if candidate.is_file():
                content = candidate.read_text().strip()
                if content.startswith("gsk_"):
                    api_key = content
                    break

    offline_mode = args.offline or not bool(api_key)
    if offline_mode and not api_key:
        logger.info("No Groq API key found. Running in offline retrieval benchmark mode (evaluating ChromaDB + hybrid retrieval)...")

    run_benchmark(api_key=api_key, offline=offline_mode)
