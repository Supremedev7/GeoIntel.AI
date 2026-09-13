# GeoIntel.AI : Autonomous Multimodal Geological Intelligence System
**Team Data Miners** | Smart India Hackathon 2026 | Problem Statement ID: **SIH26023**  
*Ministry of Coal & Central Mine Planning & Design Institute (CMPDI) / Coal India Limited (CIL)*

---

## ⛏️ About Team "Data Miners" & GeoIntel Core
**Data Miners** represents a dual-concept coherence: harnessing advanced software data-mining algorithms to extract deep domain intelligence from complex coal-mining archives, borehole exploration logs, and Detailed Project Reports (DPRs).

**GeoIntel Core** is an enterprise-grade, frontier-AI reporting and spatial audit platform powered by **Groq LPU Hardware Acceleration (Meta LLaMA 3.3 70B & Qwen 2.5 32B)**, **PyMuPDF Spatial Text-Coordinate Extraction**, and **ChromaDB High-Density Vector Embeddings**.

---

## 📑 Official Smart India Hackathon 2026 Deliverables
- **Official Presentation (PowerPoint):** [`SIH2026_GeoIntel_Core_Data_Miners.pptx`](./SIH2026_GeoIntel_Core_Data_Miners.pptx)  
  *Strictly adheres to official guidelines: 6 slides, concise points, rich architecture diagrams, and real application screenshots.*
- **Official Presentation (PDF):** [`SIH2026_GeoIntel_Core_Data_Miners.pdf`](./SIH2026_GeoIntel_Core_Data_Miners.pdf)  
  *Print-ready 16:9 widescreen format required for portal submission.*

---

## 🏗️ 4-Stage Multimodal Architecture

```
+---------------------------------------------------------------------------------------------------+
|                                          GeoIntel Core                                            |
|                  CMPDI & Coal India Geological Intelligence • Built by Team Data Miners            |
+---------------------------------+---------------------------------+-------------------------------+
| 1. INGESTION & EXTRACTION       | 2. INDEXING & KNOWLEDGE BASE   | 3. RESILIENT INFERENCE        |
| • Ministry of Coal Archives     | • Sliding-Window Spatial Chunks | • Groq LPU Hardware Inference |
| • Live Web Scraper & Ingester   | • All-MiniLM-L6-v2 Embeddings   | • Dynamic Token Budgeting     |
| • PyMuPDF Bounding-Box Normaliz.| • ChromaDB Dense Vector Store   | • Spatial BBox Verification   |
| • Instant Multipart PDF Upload  | • Domain Geological Lexicon     | • Zero-Downtime Local Fallback|
+---------------------------------+---------------------------------+-------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 4. PRESENTATION & MULTIMODAL SYNTHESIS (React 18 + Vite + FastAPI)                                |
| • Split-Screen ChatGPT-Style Spatial PDF Audit (Dynamic Amber Bounding-Box Overlays)              |
| • Geological Analytics Dashboard (Interactive Word Cloud with In-Place Occurrence Inspector)      |
| • Autonomous Report Studio (Custom Directives driving Publication-Grade ReportLab PDF & DOCX)     |
+---------------------------------------------------------------------------------------------------+
```

---

## 🚀 Key Functional Modules

### 1. Split-Screen Spatial PDF Audit & Dynamic Citations
- ChatGPT-style assistant querying 100+ multi-page geological documents.
- Interactive citation pills (e.g. `P.1`, `P.48`) jump the embedded viewer directly to the target page and render **real-time amber bounding-box SVG overlays** at exact coordinates `[x0, y0, x1, y1]`.
- Dynamic citation binding: Bounding boxes and snippet cards cleanly disappear when navigating to non-cited pages.

### 2. Geological Analytics & Interactive Semantic Word Cloud
- Domain-specific term extraction across Gondwana stratigraphy, CIL subsidiaries (MCL, SECL, NCL, CCL, WCL, BCCL, ECL), and mining operational metrics (OBR, GCV, stripping ratios).
- **In-Place Occurrence Inspector**: Click any word cloud chip (e.g., *Barakar*, *Overburden*, *First Mile Connectivity*) to inspect its verified occurrences and source sentences across the entire corpus without leaving the dashboard.
- Zero-citation filtering: Cleanly filters out noise so only verified domain entities appear.

### 3. Autonomous Multi-Format Report Studio
- Autonomous report generator allowing engineers to provide custom technical directives and notes (e.g., specific stripping ratio benchmarks, washery yield targets).
- **Directives-Driven Synthesis**: User comments directly guide vector search retrieval, section hierarchy, and tabular data.
- **In-Site Official PDF Preview**: Review the generated official PDF directly in the browser via an inline viewer before downloading.
- Export to verified `.docx` (Word), `.pdf` (ReportLab print-ready), and `.md` (Markdown).

### 4. Enterprise Document Repository & Live Ingestion Hub
- Scaled for **100+ documents** and **2,000+ vector chunks**.
- Drag & Drop zone supporting instant ingestion with automatic versioning (`_v2.pdf`) and real-time index count updates.
- One-click "Audit in Viewer" jumps directly from any repository card into the Split-Screen RAG interface.

---

## ⚡ Quick Start & Run

### Option 1: Single-Command Docker Deployment (Recommended)
```bash
# Clone the repository
git clone https://github.com/Supremedev7/GeoIntel.AI.git
cd GeoIntel.AI

# Launch containerized stack (Frontend + Backend + Vector DB + OCR)
docker compose up -d

# Open in browser: http://localhost:8000
```

### Option 2: Local Development
**Prerequisites:** Python 3.10+, Node.js 18+, Tesseract OCR
```bash
# Clone the repository
git clone https://github.com/Supremedev7/GeoIntel.AI.git
cd GeoIntel.AI

# Launch both Backend (FastAPI :8000) and Frontend (Vite :5173)
python3 run_demo.py
```

### Access Points:
- **Web User Interface (Local Dev):** [http://localhost:5173](http://localhost:5173)
- **Production / Docker Combined:** [http://localhost:8000](http://localhost:8000)
- **FastAPI REST API:** [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI / Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛡️ Security & Compliance
- **100% On-Premises Indexing:** Sensitive borehole reserves and mine plans remain within institutional boundaries.
- **Auditable Provenance:** Every metric is grounded in official government and CMPDI documents.
- **DGMS & Ministry Standards:** Conforms to statutory mining plan and environmental closure guidelines.

---
**Team Data Miners** • *Smart India Hackathon 2026*
