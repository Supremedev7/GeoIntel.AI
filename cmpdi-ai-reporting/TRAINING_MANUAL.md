# GeoIntel Core — Training Manual

**For CMPDI/CIL Staff, Ministry Officers, and System Administrators**  
**Version:** 1.0 | **Team:** Data Miners | **SIH 2026 — PS SIH26023**

---

## Table of Contents

1. [What is GeoIntel Core?](#1-what-is-geointel-core)
2. [Getting Started — Setting Up Your API Key](#2-getting-started)
3. [How to Ask Questions (RAG Q&A)](#3-how-to-ask-questions)
4. [How to Generate Reports](#4-how-to-generate-reports)
5. [Understanding the Analytics Dashboard](#5-analytics-dashboard)
6. [Managing Your Document Repository](#6-document-repository)
7. [Troubleshooting & FAQs](#7-troubleshooting)
8. [Glossary of Terms](#8-glossary)

---

## 1. What is GeoIntel Core?

GeoIntel Core is an AI-powered platform that helps you:

- **Search 100+ geological and mining documents instantly** using plain English questions
- **Get answers with proof** — every answer shows you exactly where in the source PDF the information was found
- **Generate professional reports** (PDF, Word, Markdown) in seconds instead of days
- **View analytics** — word clouds, production charts, and topic clusters across all documents
- **Upload new documents** — PDFs, spreadsheets (XLSX/CSV), and images are automatically processed

### Who is this for?

| Role | What you'll use |
|:---|:---|
| **Geologists** | Ask about formations, seams, borehole data, stratigraphic analysis |
| **Mine Planning Officers** | Query production figures, OBR metrics, stripping ratios |
| **Ministry Officials** | Generate executive briefs, answer parliamentary questions quickly |
| **Administrators** | Upload documents, manage API keys, monitor system health |

---

## 2. Getting Started

### Step 1: Open GeoIntel Core
Navigate to the GeoIntel Core web portal in your browser (Chrome, Firefox, or Edge recommended).

### Step 2: Configure Your Groq API Key
When you first open the system, you'll see a modal asking for your **Groq API Key**.

1. Visit [console.groq.com/keys](https://console.groq.com/keys) to get a free API key
2. Copy your key (it starts with `gsk_`)
3. Paste it into the input field
4. Click **"Save & Activate"**
5. The system will validate your key and show which AI model is active

> **Note:** Your key is stored only in your browser. It is never saved on the server.

### Step 3: You're Ready!
You'll see four tabs at the top of the screen:
- **🔍 Q&A Assistant** — Ask questions and view source PDFs
- **📊 Dashboard** — Analytics, word clouds, and production charts
- **📝 Reports** — Generate professional reports
- **📁 Repository** — Browse and upload documents

---

## 3. How to Ask Questions

### Using the Q&A Assistant

1. Click the **"Q&A Assistant"** tab (it's the default view)
2. Type your question in the text field at the bottom
3. Press Enter or click Send

### Example Questions You Can Ask

| Category | Example Question |
|:---|:---|
| **Production** | "What is the total coal production of MCL for FY 2023-24?" |
| **Geology** | "Explain the Barakar formation in the Jharia coalfield" |
| **Exploration** | "How much exploratory drilling did CMPDI achieve?" |
| **OBR** | "What is the stripping ratio for opencast mines in SECL?" |
| **Safety** | "What are the safety protocols for underground mines?" |
| **CBM** | "What is the CBM potential in Bokaro coalfield?" |
| **Comparison** | "Compare production targets vs actuals for all subsidiaries" |

### Understanding the Answer

When you receive an answer, you'll see:
- **The AI-generated answer** in the left panel
- **Citation pills** (like `P.3`, `P.48`) next to referenced sentences
- **Click any citation** → the right panel will jump to that exact page and highlight the source text with an amber box

### Tips for Better Results
- Be specific: "MCL production FY 2023-24" is better than "production"
- You can filter by document using the dropdown above the chat
- The system automatically understands geological terms and abbreviations

---

## 4. How to Generate Reports

### Step-by-Step Report Generation

1. Click the **"Reports"** tab
2. **Select Report Type:**
   - Comprehensive Audit — Full production + financial overview
   - Production & OBR — Overburden removal and stripping analysis
   - Geological Exploration — Drilling meterage and formation assessment
   - CBM & Clean Coal — Methane reserves and beneficiation
   - Custom Inquiry — Your own specific topic
3. **Select Subsidiary:** Choose MCL, SECL, NCL, CCL, WCL, BCCL, ECL, or "All CIL Aggregate"
4. **Select Timeframe:** FY 2023-24 (default)
5. **Add Custom Notes (optional):** Type specific instructions like "Focus on Talcher coalfield bench advance protocols"
6. Click **"Generate Report"**

### What You Get

After 10–30 seconds, you'll receive:
- **Inline preview** of the generated report
- **Download buttons** for:
  - 📄 PDF (publication-grade, branded with CMPDI headers)
  - 📝 Word Document (DOCX, editable)
  - 📋 Markdown (plain text with formatting)
- **Factual Audit** — The system checks its own claims against source documents and shows a confidence score

### Report History
Scroll down in the Reports tab to see all previously generated reports with one-click download.

---

## 5. Analytics Dashboard

### Word Cloud
- Displays the most important geological and mining terms found across all documents
- **Larger words** = more frequent in the archive
- **Click any word** → see every sentence where it appears, with file and page references

### Subsidiary Performance Charts
- Bar charts showing production (opencast + underground) for all 7 CIL subsidiaries
- Target vs. actual comparison
- Growth percentage indicators

### Topic Clusters
- Groups related terms into themes:
  - Gondwana Stratigraphy & Exploration
  - Opencast Extraction & Overburden
  - Coal Beneficiation & Technology
  - Key Coal Operating Subsidiaries

### KPI Cards
- Total production (MT), drilling meterage, OBR volume, power dispatch, CBM reserves

### Occurrence Inspector
- Click any term in the word cloud
- Opens a detailed view showing:
  - Total occurrences across all documents
  - Which documents mention this term
  - Exact sentences with page numbers
  - One-click "Audit in Viewer" to jump to the source PDF

---

## 6. Document Repository

### Browsing Documents
- Click the **"Repository"** tab to see all indexed documents
- Each card shows: filename, size, pages, indexed chunks, upload date

### Uploading New Documents

**Supported formats:**
| Format | Extension | Processing |
|:---|:---|:---|
| PDF Documents | `.pdf` | Text extraction with spatial coordinates |
| Scanned PDFs | `.pdf` (image-only) | Automatic OCR text extraction |
| Excel Spreadsheets | `.xlsx` | Row-by-row data extraction |
| CSV Files | `.csv` | Tabular data indexing |
| Images | `.png`, `.jpg`, `.jpeg`, `.tiff` | OCR text recognition |

**How to upload:**
1. Click the upload area or drag-and-drop your file
2. The system automatically:
   - Parses the document content
   - Indexes it into the vector database
   - Makes it searchable immediately
3. If a file with the same name exists, it's auto-versioned (e.g., `report_v2.pdf`)

### Auditing a Document
- Click **"Audit in Viewer"** on any document card
- This opens the Q&A tab with the PDF loaded in the viewer
- You can now ask questions specifically about that document

---

## 7. Troubleshooting & FAQs

### Q: I see "API Key Required" — what do I do?
Click the key icon in the header, enter your Groq API key (get one free at console.groq.com/keys), and click "Save & Activate."

### Q: My question returned an irrelevant answer — what can I do?
- Try rephrasing with more specific terms
- Use the document filter dropdown to scope your search to a specific file
- Include the subsidiary name (e.g., "MCL" instead of "Mahanadi")

### Q: The report generation is taking too long
Report generation depends on the Groq API. If it takes more than 60 seconds:
- Check your internet connection
- The API may be rate-limited — wait 30 seconds and try again
- The system automatically tries 14 different AI models if one fails

### Q: I uploaded a scanned PDF but the search doesn't find anything in it
- Image-only scanned PDFs are processed with OCR (optical character recognition)
- OCR quality depends on scan resolution — 300 DPI or higher is recommended
- Very old or damaged scans may produce low-quality text extraction

### Q: Can I delete a document?
Currently, documents cannot be deleted through the web interface. Contact your system administrator for manual removal.

### Q: Is my data secure?
- All documents are stored on your local server — they never leave your network
- Your API key is stored only in your browser (not on the server)
- No document content is sent to external services except as query context to the Groq AI model

---

## 8. Glossary

| Term | Definition |
|:---|:---|
| **Barakar** | A geological formation in the Lower Gondwana group, containing major commercial coal seams |
| **BBox** | Bounding Box — the exact rectangular coordinates [x0, y0, x1, y1] of text on a PDF page |
| **CBM** | Coal Bed Methane — natural gas trapped in coal seams |
| **ChromaDB** | The vector database where all document text is stored for AI search |
| **CIL** | Coal India Limited — the parent company of all coal mining subsidiaries |
| **CMPDI** | Central Mine Planning & Design Institute — responsible for geological exploration and mine planning |
| **DPR** | Detailed Project Report |
| **FMC** | First Mile Connectivity — mechanized coal transport from mine to dispatch point |
| **GCV** | Gross Calorific Value — the heat energy content of coal |
| **Gondwana** | The geological supergroup containing India's major coal-bearing formations |
| **Groq** | The AI hardware provider whose models power GeoIntel Core's question answering |
| **HEMM** | Heavy Earth Moving Machinery — shovels, dumpers, draglines used in opencast mining |
| **LLaMA** | Large Language Model by Meta — the AI model used for generating answers and reports |
| **MT** | Million Tonnes — standard unit for coal production measurement |
| **OBR** | Overburden Removal — excavation of non-coal material to expose coal seams |
| **OCR** | Optical Character Recognition — technology to extract text from images/scans |
| **RAG** | Retrieval-Augmented Generation — the AI technique that finds relevant documents before generating answers |
| **Raniganj** | A geological formation containing coal seams, primarily in West Bengal/Jharkhand |
| **Stripping Ratio** | Volume of overburden removed per tonne of coal extracted (m³/t) |
| **Vector** | A mathematical representation of text meaning used for semantic search |

---

*For technical support, contact Team Data Miners or your system administrator.*
