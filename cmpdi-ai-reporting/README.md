# GeoIntel Core : Enterprise Spatial Document Intelligence & Autonomous Geological RAG Platform
**Team Data Miners** | Smart India Hackathon 2026 | Problem Statement ID: **SIH26023**  
*Ministry of Coal & Central Mine Planning & Design Institute (CMPDI) / Coal India Limited (CIL)*

[![Live Deployment](https://img.shields.io/badge/Render-Live%20Platform-00E599?style=for-the-badge&logo=render&logoColor=white)](https://geointel-ai-fg9a.onrender.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Spatial%20Vectors-FF6F00?style=for-the-badge&logo=databricks&logoColor=white)](https://www.trychroma.com)
[![Tests](https://img.shields.io/badge/Tests-81%2F81%20Passed-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)](./backend/tests)

---

## ⛏️ Executive Summary

**GeoIntel Core** is an enterprise-grade spatial document intelligence system engineered specifically to eliminate hallucination in high-stakes mining audits, geological stratigraphy correlation, and Detailed Project Report (DPR) analysis.

By linking generative language statements to exact **2D Cartesian bounding boxes** ($[x_0, y_0, x_1, y_1]$) extracted directly from PDF pages via PyMuPDF, engineers and auditors can verify production claims, stratigraphy intervals, and stripping ratios with one-click physical grounding.

![Figure 1: Analytics Dashboard](../docs/documentation_assets/fig_01_analytics_dashboard.png)
*Figure 1: GeoIntel Core — Executive Analytics Dashboard & High-Density Mining Word Cloud with live aggregated national coal metrics.*

---

## 📑 Deliverables & Official Documentation

- 📕 **Complete Technical Documentation & Visual Evidence Report (PDF):**  
  [`GeoIntel_Core_Platform_Documentation.pdf`](./GeoIntel_Core_Platform_Documentation.pdf)  
  *13-page publication PDF with 18 high-resolution visual evidence figures.*
- 📊 **Official Presentation (PowerPoint):**  
  [`../SIH2026_GeoIntel_Core_Data_Miners.pptx`](../SIH2026_GeoIntel_Core_Data_Miners.pptx)
- 📄 **Official Presentation (PDF):**  
  [`../SIH2026_GeoIntel_Core_Data_Miners.pdf`](../SIH2026_GeoIntel_Core_Data_Miners.pdf)

---

## 🏗️ System Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                     GEOINTEL CORE ARCHITECTURE                                     |
+----------------------------------------------------------------------------------------------------+
|  UI / UX LAYER (React 18 + Vite 5 + TailwindCSS)                                                   |
|  - Tone-on-Tone Elevation: Dark Slate (#0E1217) & Light Slate (#EBEEF2)                           |
|  - Layout Boundaries: Grid Track Isolation (CLS = 0.00)                                            |
|  - 6-Step Onboarding State Machine (OnboardingTour.jsx)                                            |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|  SPATIAL VIEWER CANVAS                          |  REST API & ROUTING (FastAPI 0.115)              |
|  - HTML5 Canvas Overlays                        |  - POST /query (Hybrid RAG + Citations)          |
|  - PyMuPDF 72-DPI Bounding Box Mapping          |  - POST /upload (Coordinate Extraction)          |
|  - Bounded Zoom Engine (65% to 150%)            |  - POST /reports/generate (.docx / .pdf)         |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|  SPATIAL RETRIEVAL & VECTOR ENGINE              |  AUTONOMOUS REPORT STUDIO                        |
|  - ChromaDB Persistent Store                    |  - ReportLab 5.0 Vector Engine                   |
|  - 384-d Dense Embeddings (all-MiniLM-L6-v2)    |  - python-docx Multi-Level Tables                |
|  - Hybrid Lexical BM25 + Dense Cosine Ranking   |  - Coal Ministry DPR Archetype Generators        |
+----------------------------------------------------------------------------------------------------+
```

---

## ⚡ Quick Start & Run

### 1-Click Cloud Deployment (Render.com)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Supremedev7/GeoIntel.AI)

### Local Development:
```bash
# From repository root
python3 run_demo.py
```
- **Web Interface:** [http://localhost:5173](http://localhost:5173)
- **FastAPI API & Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

**Team Data Miners** • *Smart India Hackathon 2026*
