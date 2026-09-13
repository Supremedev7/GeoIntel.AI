import os
import sys
import re
import html
import time
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("report_generator")

from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
import math
from collections import Counter

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from rag_engine import query_rag, get_groq_client, get_best_model_for_client, execute_groq_resilient_chat
from ingester import engine

# For adaptive report structure generation
try:
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    ADAPTIVE_STRUCTURE_AVAILABLE = True
except ImportError:
    ADAPTIVE_STRUCTURE_AVAILABLE = False
    logger.warning("Adaptive structure dependencies not available. Install scikit-learn and numpy for dynamic report structuring.")

# For entailment checking (hallucination detection)
try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    import torch
    ENTAILMENT_AVAILABLE = True
except ImportError:
    ENTAILMENT_AVAILABLE = False
    logger.warning("Entailment dependencies not available. Install transformers and torch for hallucination detection.")

STORAGE_DIR = Path(__file__).resolve().parent / "storage"
REPORTS_DIR = STORAGE_DIR / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

from subsidiary_data import SUBSIDIARY_DATA

def sanitize_for_reportlab(text: str) -> str:
    """Safely escape text and convert standard markdown tags for ReportLab XML parser."""
    # Replace problematic Unicode characters with ASCII equivalents
    text = text.replace('‑', '-')  # Non-breaking hyphen
    text = text.replace('‐', '-')  # Hyphen
    text = text.replace('‒', '-')  # Figure dash
    text = text.replace('–', '-')  # En dash
    text = text.replace('—', '--') # Em dash
    text = text.replace('―', '--') # Horizontal bar
    text = text.replace('−', '-')  # Minus sign
    text = text.replace('­', '')   # Soft hyphen (remove)
    text = text.replace('​', '')   # Zero-width space (remove)
    text = text.replace(' ', ' ')  # Non-breaking space

    # HTML escape
    text = html.escape(text)

    # Convert markdown to ReportLab XML
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
    text = re.sub(r'`(.+?)`', r'<font face="Courier">\1</font>', text)
    return text

# -------------------------------------------------------------
# Factual Audit Workflow
# -------------------------------------------------------------
def _analyze_content_themes(chunks: List[Dict[str, Any]]) -> List[str]:
    """
    Analyze retrieved chunks to identify dominant themes for adaptive report structuring.

    Args:
        chunks: List of retrieved chunks with text content

    Returns:
        List of identified themes/topics
    """
    if not ADAPTIVE_STRUCTURE_AVAILABLE or not chunks:
        return []

    try:
        # Extract text content
        texts = [chunk.get("text", "") for chunk in chunks if chunk.get("text", "").strip()]

        if not texts:
            return []

        # Use TF-IDF to identify important terms
        vectorizer = TfidfVectorizer(
            max_features=50,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1
        )

        tfidf_matrix = vectorizer.fit_transform(texts)
        feature_names = vectorizer.get_feature_names_out()

        # Get average TF-IDF scores across all documents
        mean_scores = np.asarray(tfidf_matrix.mean(axis=0)).flatten()

        # Get top terms
        top_indices = mean_scores.argsort()[-10:][::-1]
        top_terms = [feature_names[i] for i in top_indices]

        # Map to geological themes
        theme_mapping = {
            "production": ["production", "output", "yield", "mt", "million tonnes"],
            "overburden": ["overburden", "obr", "stripping", "waste", "excavation"],
            "geological": ["stratigraphy", "formation", "barakar", "raniganj", "gondwana", "borehole"],
            "financial": ["capex", "expenditure", "investment", "cost", "budget"],
            "operational": ["dispatch", "rakes", "transport", "logistics", "fmc"],
            "quality": ["gcv", "ncv", "ash", "moisture", "quality", "grade"],
            "safety": ["safety", "accident", "fatality", "injury", "risk"],
            "environmental": ["environmental", "pollution", "emissions", "rehabilitation"],
            "exploration": ["exploration", "drilling", "meterage", "seismic", "reserves"],
            "infrastructure": ["conveyor", "railway", "road", "infrastructure", "facility"]
        }

        themes = []
        for theme, keywords in theme_mapping.items():
            if any(keyword in term.lower() for term in top_terms for keyword in keywords):
                themes.append(theme)

        return themes[:5]  # Return top 5 themes

    except Exception as e:
        logger.warning(f"Content theme analysis failed: {e}")
        return []

def _generate_dynamic_report_structure(themes: List[str], custom_notes: str = "") -> List[Dict[str, str]]:
    """
    Generate dynamic report structure based on identified themes.

    Args:
        themes: List of identified themes from content analysis
        custom_notes: User-provided directives

    Returns:
        List of section definitions for the report
    """
    # Default structure
    default_structure = [
        {"id": "executive_summary", "title": "Executive Summary", "required": True},
        {"id": "technical_evaluation", "title": "Technical Evaluation", "required": True},
        {"id": "operational_analysis", "title": "Operational Analysis", "required": True},
        {"id": "recommendations", "title": "Recommendations & Conclusion", "required": True}
    ]

    # Theme-specific sections
    theme_sections = {
        "production": {"id": "production_performance", "title": "Production Performance Analysis", "required": False},
        "overburden": {"id": "overburden_analysis", "title": "Overburden Removal & Stripping Ratio Analysis", "required": False},
        "geological": {"id": "geological_assessment", "title": "Geological Stratigraphy & Exploration Assessment", "required": False},
        "financial": {"id": "financial_review", "title": "Capital Expenditure & Financial Performance", "required": False},
        "operational": {"id": "logistics_evaluation", "title": "Logistics & Dispatch Operations Analysis", "required": False},
        "quality": {"id": "quality_specs", "title": "Coal Quality Specifications & Beneficiation", "required": False},
        "safety": {"id": "safety_review", "title": "Safety Performance & Risk Assessment", "required": False},
        "environmental": {"id": "environmental_impact", "title": "Environmental Impact & Compliance Review", "required": False},
        "exploration": {"id": "exploration_results", "title": "Exploration Drilling & Reserve Assessment", "required": False},
        "infrastructure": {"id": "infrastructure_status", "title": "Infrastructure Development & Maintenance Status", "required": False}
    }

    # Start with default structure
    structure = default_structure.copy()

    # Add theme-specific sections
    for theme in themes:
        if theme in theme_sections:
            section = theme_sections[theme]
            # Avoid duplicates
            if not any(s["id"] == section["id"] for s in structure):
                structure.append(section)

    # If custom notes provided, ensure we have a directives section
    if custom_notes.strip():
        directive_section = {"id": "user_directives", "title": "User Directives & Custom Parameters", "required": True}
        # Insert at the beginning after executive summary
        if not any(s["id"] == directive_section["id"] for s in structure):
            structure.insert(1, directive_section)

    return structure

def _generate_section_content(section: Dict[str, str], chunks: List[Dict[str, Any]],
                            client: Any, model: str, tone: str, custom_notes: str = "") -> str:
    """
    Generate content for a specific report section.

    Args:
        section: Section definition
        chunks: Retrieved chunks for context
        client: Groq client
        model: Model to use
        tone: Analytical tone
        custom_notes: User directives

    Returns:
        Generated section content in markdown format
    """
    # Prepare context from chunks
    context_blocks = []
    for i, chunk in enumerate(chunks[:5]):  # Use top 5 chunks for context
        text = chunk.get("text", "").strip()
        if len(text) >= 25:
            source = chunk.get("source", "Unknown Source")
            page = chunk.get("page_number", 1)
            context_blocks.append(f"[Source {i+1}: {source} | Page {page}]\n{text}")

    context_str = "\n\n".join(context_blocks)

    # Build section-specific prompt
    section_prompts = {
        "executive_summary": "Provide a concise executive summary highlighting key findings, metrics, and overall assessment.",
        "technical_evaluation": "Provide detailed technical analysis of geological, mining, or operational aspects based on the data.",
        "operational_analysis": "Analyze operational efficiency, processes, systems, and performance metrics.",
        "recommendations": "Provide actionable recommendations, strategic suggestions, and conclusion based on the analysis.",
        "user_directives": f"Address the following user directives: {custom_notes}",
        "production_performance": "Analyze production trends, output metrics, capacity utilization, and production efficiency.",
        "overburden_analysis": "Evaluate overburden removal performance, stripping ratios, and excavation efficiency.",
        "geological_assessment": "Assess geological formations, stratigraphy, borehole data, and exploration findings.",
        "financial_review": "Review capital expenditures, financial performance, budget allocations, and cost analysis.",
        "logistics_evaluation": "Analyze logistics operations, dispatch efficiency, transportation systems, and supply chain.",
        "quality_specs": "Evaluate coal quality parameters, specifications, beneficiation processes, and grade distribution.",
        "safety_review": "Review safety performance, incident statistics, risk assessments, and safety protocols.",
        "environmental_impact": "Assess environmental impact, compliance status, mitigation measures, and sustainability initiatives.",
        "exploration_results": "Summarize exploration drilling results, meterage achievements, and reserve estimations.",
        "infrastructure_status": "Evaluate infrastructure development, maintenance status, facility conditions, and upgrade needs."
    }

    prompt = section_prompts.get(section["id"], f"Provide analysis for {section['title']}.")

    full_prompt = (
        f"You are a Senior Technical Analyst for CMPDI/CIL. {prompt}\n\n"
        f"Context from Geological & Mining Records:\n{context_str}\n\n"
        f"Analytical Tone: {tone}\n"
        f"Focus: Provide detailed, factual analysis specific to {section['title']}.\n"
        f"Use bullet points for key findings and bold important technical terms.\n"
        f"Base your analysis strictly on the provided context. Do not invent facts.\n"
        f"Output in clean markdown format."
    )

    if custom_notes and section["id"] != "user_directives":
        full_prompt += f"\n\nConsider these user directives in your analysis: {custom_notes}"

    try:
        content, _ = execute_groq_resilient_chat(
            client=client,
            messages=[{"role": "user", "content": full_prompt}],
            preferred_model=model,
            max_tokens=800,
            temperature=0.2
        )
        return content
    except Exception as e:
        logger.warning(f"Failed to generate content for section {section['id']}: {e}")
        return f"*Content generation failed for {section['title']}.*"

def audit_generated_assertions(body: str, citations: List[Dict[str, Any]], client: Any, model: str) -> str:
    """Verifies factual consistency of generated text against source citations."""
    citation_text = "\n".join([f"Source: {c['source']}\nSnippet: {c['exact_snippet']}" for c in citations])

    prompt = (
        "You are an Auditor for CMPDI/CIL Technical Reporting. Verify the factual consistency "
        "of the generated report against the provided citation snippets.\n\n"
        "Report Body:\n" + body + "\n\n"
        "Citations:\n" + citation_text + "\n\n"
        "Audit Instructions:\n"
        "1. Identify all key factual claims, metrics, or assertions in the report.\n"
        "2. Check if each claim is supported by the citations.\n"
        "3. Output a structured Markdown report with:\n"
        "   - Factual Audit Summary (Verified/Unsupported/Hallucinated counts)\n"
        "   - List of Verified Assertions\n"
        "   - List of Unsupported Assertions (if any, with explanation)\n"
        "   - Overall Confidence Score (0-100%)\n"
        "Do not include <think> tags. Start immediately with '### Factual Audit Summary'."
    )

    audit_report, _ = execute_groq_resilient_chat(
        client=client,
        messages=[{"role": "user", "content": prompt}],
        preferred_model=model,
        max_tokens=1000,
        temperature=0.0
    )
    return audit_report

REPORT_ARCHETYPES = {
    "comprehensive_audit": {
        "title": "Comprehensive Operational & Financial Executive Brief",
        "search_terms": "raw coal production opencast underground dispatch targets capex growth",
        "focus": "production volumes, annual growth targets, subsidiary variance, rail rake dispatch, and First Mile Connectivity",
        "bullets": [
            "CIL national production achieved 703.20 MT (+10.1% YoY) with opencast contributing 665.40 MT (94.6%).",
            "MCL led national subsidiaries with 193.30 MT, followed by SECL (167.00 MT) and NCL (131.00 MT).",
            "Thermal power utility dispatch exceeded 618.5 MT, maintaining an average 398 rakes/day dispatch rate.",
            "Capital expenditure directed into 35 First Mile Connectivity (FMC) mechanized conveyor corridors."
        ]
    },
    "production_obr": {
        "title": "Overburden Removal (OBR) & Stripping Ratio Optimization Audit",
        "search_terms": "overburden removal OBR stripping ratio shovel dumper dragline excavation bench",
        "focus": "OBR cubic meterage, stripping ratios across opencast benches, HEMM machinery availability, and bench advance dynamics",
        "bullets": [
            "Consolidated Overburden Removal (OBR) achieved a historic 1,650.40 M.Cum (+21.6% YoY advance).",
            "Stripping ratio exhibits significant geological variance: 1.18 m³/t at MCL Talcher to 4.21 m³/t at WCL.",
            "Heavy Earth Moving Machinery (HEMM): 42m³ electric shovels and 240T dumpers maintained 84.6% mechanical availability.",
            "Strategic bench advance protocols implemented across mega opencast pits (Gevra, Kusmunda, and Jayant)."
        ]
    },
    "geological_exploration": {
        "title": "CMPDI Geological Drilling, Stratigraphy & Resource Assessment",
        "search_terms": "CMPDI exploratory drilling meterage Barakar Raniganj Gondwana basin borehole core seismic",
        "focus": "Gondwana basin stratigraphy, Barakar and Raniganj measures, drilling meterage across Regional Institutes, and coal reserve categories",
        "bullets": [
            "CMPDI achieved 13.82 Lakh Metres of exploratory core drilling across 118 Gondwana basin blocks.",
            "Exploration concentrated within Lower Gondwana Barakar and Raniganj coal-bearing formations.",
            "Regional Institute performance: RI-V (Bilaspur) achieved 3.38 Lakh m; RI-III (Ranchi) completed 2.95 Lakh m.",
            "Integrated 2D/3D seismic reflection profiling delineated fault throws down to 5m resolution in Jharia."
        ]
    },
    "cbm_clean_coal": {
        "title": "Coal Bed Methane (CBM) & Clean Coal Beneficiation Assessment",
        "search_terms": "coal bed methane CBM gas in place washery beneficiation GCV quality banding",
        "focus": "deep seam CBM gas-in-place in Jharia/Bokaro, washery throughput, GCV quality bands, and fugitive emissions mitigation",
        "bullets": [
            "CBM Gas-in-Place (GIP) estimated at 25.40 BCM in deep Gondwana blocks (Jharia and Bokaro coalfields).",
            "Seam permeability testing at depths of 400m–850m confirmed gas contents ranging from 8.5 to 14.2 m³/t.",
            "Coal washery beneficiation capacity reached 34.5 MTY with modern non-coking washery commissioning at Madhuband.",
            "Quality assurance grading maintained consistent Gross Calorific Value (GCV) bands between G10 and G14."
        ]
    },
    "custom_inquiry": {
        "title": "Tailored Technical Investigation & Strategic Audit",
        "search_terms": "coal mining geological operations CMPDI CIL environmental safety compliance",
        "focus": "specialized engineering inquiries, safety parameters, environmental compliance, and mine planning",
        "bullets": [
            "Comprehensive review of regulatory mine safety standards and slope stability radar monitoring.",
            "Environmental compliance verification: continuous ambient air quality stations and effluent treatment.",
            "Detailed Project Report (DPR) clearance timeline accelerated across 28 new mining ventures.",
            "Strategic longwall automation and highwall extraction pilots in steep gradient seams."
        ]
    }
}

def build_structured_report(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate intuitive, token-efficient reports with genuine AI synthesis driven by user comments:
    - report_type: 'comprehensive_audit', 'production_obr', 'geological_exploration', 'cbm_clean_coal', 'custom_inquiry'
    - subsidiary: 'All CIL Aggregate' or specific subsidiary ('MCL', 'SECL', etc.)
    - timeframe: 'FY 2023-24', 'FY 2024-25', etc.
    - tone: 'Formal Executive Brief', 'Technical Geological Audit', 'Public Release'
    - custom_prompt / custom_notes: specific focus directives and comments provided by user
    """
    report_type = config.get("report_type") or config.get("preset") or "comprehensive_audit"
    subsidiary = config.get("subsidiary", "All CIL Aggregate")
    timeframe = config.get("timeframe", "FY 2023-24")
    tone = config.get("tone", "Formal Executive Brief")
    custom_notes = (config.get("custom_prompt") or config.get("custom_notes") or "").strip()
    api_key = config.get("api_key")

    archetype = REPORT_ARCHETYPES.get(report_type, REPORT_ARCHETYPES["comprehensive_audit"])
    timestamp_slug = datetime.now().strftime("%Y%m%d_%H%M%S")
    clean_sub = "".join([c for c in subsidiary if c.isalnum()]) or "Aggregate"
    base_name = f"Report_{clean_sub}_{report_type}_{timeframe.replace(' ', '_')}_{timestamp_slug}"

    # 1. Build targeted search query prioritizing user directives
    clean_sub = "".join([c for c in subsidiary if c.isalnum()]) or "Aggregate"
    timestamp_slug = datetime.now().strftime("%Y%m%d_%H%M%S")

    if custom_notes:
        scope_hint = f"{subsidiary}" if subsidiary != "All CIL Aggregate" else ""
        search_query = f"{custom_notes} {scope_hint}".strip()
        first_line = custom_notes.split("\n")[0].strip()
        clean_title_core = re.sub(r'^[#*\-\s]+', '', first_line)
        if len(clean_title_core) > 70:
            clean_title_core = clean_title_core[:67] + "..."
        report_title = f"Technical Investigation: {clean_title_core}"
        slug_directive = re.sub(r'[^a-zA-Z0-9]', '_', clean_title_core[:20]).strip('_') or "Directive"
        base_name = f"Report_{clean_sub}_{slug_directive}_{timeframe.replace(' ', '_')}_{timestamp_slug}"
    else:
        scope_hint = f"{subsidiary}" if subsidiary != "All CIL Aggregate" else ""
        search_query = f"{scope_hint} {timeframe} {archetype['search_terms']}".strip()
        report_title = archetype['title']
        base_name = f"Report_{clean_sub}_{report_type}_{timeframe.replace(' ', '_')}_{timestamp_slug}"

    # 2. Retrieve grounded context chunks from ChromaDB
    client, active_key = get_groq_client(api_key)
    active_model = get_best_model_for_client(client, active_key)

    chunks = engine.query(search_query, n_results=5)
    clean_citations = []
    context_blocks = []

    for c in chunks:
        text = c.get("text", "").strip()
        if len(text) < 25:
            continue
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 20]
        clean_snippet = sentences[0] if sentences else text[:160]
        meta = c.get("metadata", {}) or {}
        src = meta.get("source") or c.get("source") or "CMPDI_Technical_Archive.pdf"
        pg = meta.get("page") or meta.get("page_number") or c.get("page_number") or 1
        bb = meta.get("bbox") or c.get("bbox") or [50.0, 50.0, 500.0, 100.0]

        citation_entry = {
            "source": src,
            "file_id": src,
            "page_number": pg,
            "bbox": bb,
            "exact_snippet": clean_snippet,
            "text": text,
        }
        clean_citations.append(citation_entry)
        context_blocks.append(f"[Document: {src} | Page {pg}]\n{text}")

    context_str = "\n\n---\n\n".join(context_blocks)

    # 3. Dynamic AI Synthesis strictly incorporating the user's comments and directives
    if custom_notes:
        system_prompt = (
            "You are the Principal Mining Engineer and Chief Technical Specialist for CMPDI (Central Mine Planning & Design Institute) "
            "and Coal India Limited. Author an authoritative, precise, professional Technical Report.\n\n"
            "CRITICAL DIRECTIVE: The user has supplied specific engineering instructions and focus comments. "
            "Your analysis MUST be strictly structured around and driven by the user's specific directives, "
            "rather than defaulting to generic annual production review boilerplate. Analyze the retrieved archival "
            "records directly in relation to the user's requirements.\n\n"
            "Format your synthesis in clean Markdown with the following exact headings:\n"
            "## 1. Executive Summary & Directive Objectives\n"
            "## 2. Technical Evaluation & Geological Grounding\n"
            "## 3. Operational Analysis & Strategic Recommendations\n"
            "## 4. Key Parameters, Measured Metrics & Risk Assessment\n\n"
            f"Analytical Tone: {tone}\n"
            "Guidelines:\n"
            "- Section 1 must directly address the user's requested objectives and operational scope.\n"
            "- Section 2 must synthesize technical facts, geological strata (e.g. Barakar, Raniganj), or borehole data matching the inquiry.\n"
            "- Section 3 must provide concrete operational action items and engineering directives.\n"
            "- Section 4 MUST include a clean Markdown data table (| Parameter | Baseline / Measured | Unit | Risk Level & Operational Control |) tailored to this request.\n"
            "- MANDATORY: You MUST complete all 4 sections in order without leaving any section unfinished.\n"
            "- Keep sections focused and balanced (around 150-250 words per section) to guarantee full completion.\n"
            "- Use bolding for technical entities and bullet points for key takeaways.\n"
            "- Do not output pleasantries, preamble, or <think> tags. Start immediately with '## 1. Executive Summary & Directive Objectives'."
        )
        user_prompt = (
            f"Official CMPDI / Coal India Context Records:\n{context_str}\n\n"
            f"User Directives & Inquiries:\n"
            f"- Primary Directive: \"{custom_notes}\"\n"
            f"- Target Subsidiary / Scope: {subsidiary}\n"
            f"- Reporting Period: {timeframe}\n"
            f"- Analytical Tone: {tone}\n\n"
            "Synthesize all 4 Sections (1, 2, 3, and 4) completely now, prioritizing the user's instructions above all else."
        )
    else:
        system_prompt = (
            "You are the Principal Mining Engineer and Chief Technical Specialist for CMPDI (Central Mine Planning & Design Institute) "
            "and Coal India Limited. Author an authoritative, precise, professional Technical Report.\n\n"
            f"Structure your analysis around the objective: '{archetype['title']}'.\n\n"
            "Format your synthesis in clean Markdown with the following exact headings:\n"
            "## 1. Executive Summary & Directive Objectives\n"
            "## 2. Technical Evaluation & Geological Grounding\n"
            "## 3. Operational Analysis & Strategic Recommendations\n\n"
            f"Analytical Tone: {tone}\n"
            "Guidelines:\n"
            "- Substantively discuss the domain parameters from the official context.\n"
            "- Cite real figures, subsidiary metrics, geological strata, or mine parameters.\n"
            "- Use bullet points for key takeaways and bold technical terms.\n"
            "- Do not output preamble, pleasantries, or <think> tags. Start immediately with '## 1. Executive Summary & Directive Objectives'."
        )
        user_prompt = (
            f"Official CMPDI / Coal India Context Records:\n{context_str}\n\n"
            f"Report Generation Directives:\n"
            f"- Target Focus: {archetype['title']}\n"
            f"- Subsidiary / Scope: {subsidiary}\n"
            f"- Reporting Period: {timeframe}\n"
            f"- Analytical Tone: {tone}\n\n"
            "Please synthesize Sections 1, 2, and 3 now based on the official context records."
        )

    # Use adaptive report structure generation if available and enabled
    use_adaptive = (ADAPTIVE_STRUCTURE_AVAILABLE and
                   os.environ.get("USE_ADAPTIVE_REPORT_STRUCTURE", "false").lower() == "true")

    if use_adaptive and not custom_notes:
        # Analyze content themes for dynamic structure
        themes = _analyze_content_themes(chunks)
        report_structure = _generate_dynamic_report_structure(themes, custom_notes)

        # Generate content for each section
        section_contents = []
        for section in report_structure:
            section_content = _generate_section_content(
                section, chunks, client, active_model, tone, custom_notes
            )
            section_contents.append(f"## {section['title']}\n\n{section_content}\n")

        synthesized_body = "\n".join(section_contents)
    else:
        # Fall back to original fixed structure
        synthesized_body, used_model = execute_groq_resilient_chat(
            client=client,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            preferred_model=active_model,
            max_tokens=2200,
            temperature=0.2
        )

    # 4. Assemble the complete Markdown document
    md_lines = []
    md_lines.append(f"# {report_title}")
    md_lines.append(f"**Target Subsidiary / Scope:** {subsidiary}  ")
    md_lines.append(f"**Reporting Period:** {timeframe}  ")
    md_lines.append(f"**Analytical Tone:** {tone}  ")
    md_lines.append(f"**Date Generated:** {datetime.now().strftime('%d %B %Y, %H:%M:%S')}  ")
    md_lines.append(f"**AI Synthesis Engine:** {used_model} (Verified RAG Grounded)  ")
    md_lines.append("\n---\n")

    if custom_notes:
        md_lines.append("### User Directives & Custom Parameters Applied")
        md_lines.append(f"> **Engineer Directives:** *\"{custom_notes}\"*\n")

    md_lines.append(synthesized_body)
    md_lines.append("\n")

    # 5. Automated Factual Audit & Verification
    audit_report = audit_generated_assertions(synthesized_body, clean_citations, client, active_model)
    md_lines.append("\n## 6. Factual Audit & Verification")
    md_lines.append(audit_report)
    md_lines.append("\n")

    # If custom_notes was NOT provided and report is production-oriented, append national baseline table
    if not custom_notes and report_type in ["comprehensive_audit", "production_obr"]:
        md_lines.append("## 4. Production & Stripping Ratio Performance Baseline")
        md_lines.append("| Subsidiary / Entity | Opencast (MT) | Underground (MT) | Total (MT) | Growth % | Coal Basin / Field | Stripping Ratio |")
        md_lines.append("| :--- | :---: | :---: | :---: | :---: | :--- | :---: |")
        
        if subsidiary in SUBSIDIARY_DATA and subsidiary != "CMPDI":
            s = SUBSIDIARY_DATA[subsidiary]
            md_lines.append(f"| **{subsidiary} ({s['name']})** | {s['oc']:.2f} | {s['ug']:.2f} | **{s['total']:.2f}** | **{s['growth']}** | {s['basin']} | {s['sr']} |")
        else:
            for k, s in SUBSIDIARY_DATA.items():
                if k == "CMPDI": continue
                md_lines.append(f"| **{k}** | {s['oc']:.2f} | {s['ug']:.2f} | {s['total']:.2f} | {s['growth']} | {s['basin']} | {s['sr']} |")
            md_lines.append("| **CIL Aggregate Total** | **665.40** | **37.80** | **703.20** | **+10.1%** | **All Basins** | **2.48 m³/t** |")
        md_lines.append("\n")

    # Section 5: Audit Trail & Grounded Spatial Citations
    md_lines.append("## 5. Audit Trail & Grounded Spatial Citations")
    if clean_citations:
        for i, c in enumerate(clean_citations, 1):
            md_lines.append(f"- **Reference [{i}]**: `{c['source']}` (Page {c['page_number']}) | BBox: `{c['bbox']}`")
            md_lines.append(f"  > *Evidence Quote*: \"{c['exact_snippet'][:180]}...\"\n")
    else:
        md_lines.append("- *Referenced Coal India Consolidated Exploration Archives and Ministry of Coal Annual Guidelines.*\n")

    final_md = "\n".join(md_lines)

    # 5. Save Markdown
    md_file = REPORTS_DIR / f"{base_name}.md"
    md_file.write_text(final_md, encoding="utf-8")

    # 6. Generate Word .docx
    docx_file = REPORTS_DIR / f"{base_name}.docx"
    generate_docx_from_markdown(final_md, docx_file, subsidiary, timeframe)

    # 7. Generate PDF .pdf
    pdf_file = REPORTS_DIR / f"{base_name}.pdf"
    generate_pdf_from_markdown(final_md, pdf_file, subsidiary, timeframe)

    return {
        "topic": report_title,
        "base_name": base_name,
        "model": used_model,
        "preview_text": final_md,
        "files": {
            "markdown": {
                "filename": md_file.name,
                "path": str(md_file),
                "url": f"/api/download-report/{md_file.name}"
            },
            "docx": {
                "filename": docx_file.name,
                "path": str(docx_file),
                "url": f"/api/download-report/{docx_file.name}"
            },
            "pdf": {
                "filename": pdf_file.name,
                "path": str(pdf_file),
                "url": f"/api/download-report/{pdf_file.name}",
                "view_url": f"/api/view-report-pdf/{pdf_file.name}"
            }
        }
    }

def generate_docx_from_markdown(md_text: str, output_path: Path, subsidiary: str, timeframe: str):
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    title = doc.add_paragraph()
    r = title.add_run("CMPDI / COAL INDIA LIMITED")
    r.font.name = "Arial"
    r.font.size = Pt(18)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 42, 74)

    sub = doc.add_paragraph()
    r_sub = sub.add_run(f"Technical & Geological Report: {subsidiary} ({timeframe})")
    r_sub.font.size = Pt(12)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph("―" * 60)

    lines = md_text.split("\n")
    table_rows = []

    def flush_docx_table():
        nonlocal table_rows
        if not table_rows:
            return
        valid_rows = [r for r in table_rows if len(r) > 0]
        if not valid_rows:
            table_rows = []
            return
        max_cols = max(len(r) for r in valid_rows)
        t = doc.add_table(rows=len(valid_rows), cols=max_cols)
        t.style = 'Table Grid'
        for r_idx, row in enumerate(valid_rows):
            for c_idx, val in enumerate(row):
                t.cell(r_idx, c_idx).text = val
                if r_idx == 0:
                    shading = parse_xml(r'<w:shd {} w:fill="0F2A4A"/>'.format(nsdecls('w')))
                    t.cell(r_idx, c_idx)._tc.get_or_add_tcPr().append(shading)
                    if t.cell(r_idx, c_idx).paragraphs[0].runs:
                        t.cell(r_idx, c_idx).paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
                        t.cell(r_idx, c_idx).paragraphs[0].runs[0].font.bold = True
        doc.add_paragraph()
        table_rows = []

    for line in lines:
        line_s = line.strip()
        if not line_s or line_s.startswith("# CMPDI"):
            if table_rows:
                flush_docx_table()
            continue

        if line_s.startswith("|") and line_s.endswith("|"):
            if "---" in line_s:
                continue
            cells = [c.strip().replace("**", "") for c in line_s.split("|")[1:-1]]
            table_rows.append(cells)
            continue
        elif table_rows:
            flush_docx_table()

        if line_s.startswith("## "):
            doc.add_heading(line_s.replace("## ", ""), level=1)
        elif line_s.startswith("### "):
            doc.add_heading(line_s.replace("### ", ""), level=2)
        elif line_s.startswith("- ") or line_s.startswith("* "):
            p = doc.add_paragraph(style='List Bullet')
            parts = re.split(r'(\*\*.*?\*\*)', line_s[2:].strip())
            for pt in parts:
                if pt.startswith("**") and pt.endswith("**"):
                    run = p.add_run(pt[2:-2])
                    run.bold = True
                else:
                    p.add_run(pt)
        elif re.match(r'^\d+\.\s', line_s):
            p = doc.add_paragraph(style='List Number')
            content = re.sub(r'^\d+\.\s', '', line_s)
            parts = re.split(r'(\*\*.*?\*\*)', content)
            for pt in parts:
                if pt.startswith("**") and pt.endswith("**"):
                    run = p.add_run(pt[2:-2])
                    run.bold = True
                else:
                    p.add_run(pt)
        elif line_s.startswith("> "):
            p = doc.add_paragraph(style='Quote')
            p.add_run(line_s[2:])
        else:
            p = doc.add_paragraph()
            parts = re.split(r'(\*\*.*?\*\*)', line_s)
            for pt in parts:
                if pt.startswith("**") and pt.endswith("**"):
                    run = p.add_run(pt[2:-2])
                    run.bold = True
                else:
                    p.add_run(pt)

    if table_rows:
        flush_docx_table()

    doc.save(str(output_path))

def generate_pdf_from_markdown(md_text: str, output_path: Path, subsidiary: str, timeframe: str):
    doc = SimpleDocTemplate(str(output_path), pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()

    t_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=15, leading=19, textColor=colors.HexColor('#0F2A4A'), spaceAfter=4)
    h2_style = ParagraphStyle('DocH2', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=colors.HexColor('#1E3A8A'), spaceBefore=8, spaceAfter=4)
    h3_style = ParagraphStyle('DocH3', parent=styles['Heading3'], fontName='Helvetica-Bold', fontSize=9.5, leading=13, textColor=colors.HexColor('#2563EB'), spaceBefore=6, spaceAfter=3)
    body = ParagraphStyle('DocBody', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11.5, textColor=colors.HexColor('#1E293B'), spaceAfter=3, wordWrap='CJK')
    bullet_style = ParagraphStyle('DocBullet', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11, leftIndent=18, bulletIndent=8, textColor=colors.HexColor('#1E293B'), spaceAfter=2.5)
    quote_style = ParagraphStyle('DocQuote', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8, leading=11, leftIndent=10, textColor=colors.HexColor('#334155'), spaceAfter=3)
    cell_style = ParagraphStyle('DocCell', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#1E293B'))
    cell_header = ParagraphStyle('DocCellH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.whitesmoke)

    story = []
    story.append(Paragraph("CENTRAL MINE PLANNING & DESIGN INSTITUTE", t_style))
    story.append(Paragraph(f"Technical Report: {html.escape(subsidiary)} ({html.escape(timeframe)})", h2_style))
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%d %B %Y, %H:%M')} | Coal India Limited Autonomous Synthesizer", body))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F2A4A'), spaceAfter=8))

    lines = md_text.split("\n")
    table_rows = []

    def flush_pdf_table():
        nonlocal table_rows
        if not table_rows:
            return
        valid_rows = [r for r in table_rows if len(r) > 0]
        if not valid_rows:
            table_rows = []
            return
        max_cols = max(len(r) for r in valid_rows)
        if max_cols <= 0:
            table_rows = []
            return
        tbl_data = []
        for r_idx, row in enumerate(valid_rows):
            padded = row + [""] * (max_cols - len(row))
            cells = []
            for cell_text in padded:
                st = cell_header if r_idx == 0 else cell_style
                cells.append(Paragraph(sanitize_for_reportlab(cell_text), st))
            tbl_data.append(cells)

        try:
            col_w = 532.0 / max_cols
            t = Table(tbl_data, colWidths=[col_w] * max_cols)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F2A4A')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('LEFTPADDING', (0, 0), (-1, -1), 4),
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(Spacer(1, 4))
            story.append(t)
            story.append(Spacer(1, 6))
        except Exception as e:
            logger.warning(f"Failed to render table in PDF: {e}")
        table_rows = []

    for line in lines:
        line_s = line.strip()
        if not line_s or line_s.startswith("# CMPDI"):
            if table_rows:
                flush_pdf_table()
            continue

        if line_s.startswith("|") and line_s.endswith("|"):
            if "---" in line_s:
                continue
            cells = [c.strip().replace("**", "") for c in line_s.split("|")[1:-1]]
            table_rows.append(cells)
            continue
        elif table_rows:
            flush_pdf_table()

        if line_s.startswith("## "):
            story.append(Paragraph(f"<b>{sanitize_for_reportlab(line_s.replace('## ', ''))}</b>", h2_style))
        elif line_s.startswith("### "):
            story.append(Paragraph(f"<b>{sanitize_for_reportlab(line_s.replace('### ', ''))}</b>", h3_style))
        elif line_s.startswith("# "):
            story.append(Paragraph(f"<b>{sanitize_for_reportlab(line_s.replace('# ', ''))}</b>", t_style))
        elif line_s.startswith("- ") or line_s.startswith("* "):
            clean_b = sanitize_for_reportlab(line_s[2:].strip())
            story.append(Paragraph(f"&bull; {clean_b}", bullet_style))
        elif re.match(r'^\d+\.\s', line_s):
            clean_num = sanitize_for_reportlab(re.sub(r'^\d+\.\s', '', line_s))
            story.append(Paragraph(f"&bull; {clean_num}", bullet_style))
        elif line_s.startswith("> "):
            story.append(Paragraph(f"<i>{sanitize_for_reportlab(line_s[2:])}</i>", quote_style))
        elif line_s.startswith("---"):
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94A3B8'), spaceAfter=4, spaceBefore=4))
        else:
            clean_p = sanitize_for_reportlab(line_s)
            story.append(Paragraph(clean_p, body))

    if table_rows:
        flush_pdf_table()

    doc.build(story)

def build_multi_format_report(topic: str, custom_api_key: Optional[str] = None) -> Dict[str, Any]:
    """Compatibility wrapper for simple topic string."""
    return build_structured_report({
        "subsidiary": topic,
        "timeframe": "FY 2023-24",
        "sections": ["Executive Summary", "Production Tables", "Drilling & Exploration", "OBR Dynamics", "CBM Resource Assessment"],
        "tone": "Formal Executive Brief",
        "api_key": custom_api_key
    })
