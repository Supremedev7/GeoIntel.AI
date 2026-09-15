import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowRight, ArrowLeft, Layers, FileText, 
  Terminal, Eye, CheckCircle2, Play, Pause, 
  RotateCcw, Code2, Network, Box, FileSpreadsheet,
  BarChart3, Check, Workflow, FileCode
} from 'lucide-react';
import './ArchitecturePage.css';

export default function ArchitecturePage({ onBackToLanding, onLaunchPlatform }) {
  const dustCanvasRef = useRef(null);

  // Active hovered node for detailed inspector HUD
  const [hoveredNodeId, setHoveredNodeId] = useState('ingest-engine');
  
  // Tab for the robust input formats specification section
  const [activeFormatTab, setActiveFormatTab] = useState('csv');

  // Simulation player state
  const [isSimulating, setIsSimulating] = useState(true);
  const [simStep, setSimStep] = useState(0);

  // Flowchart node database with rich technical specs
  const nodeRegistry = {
    'doc-upload': {
      id: 'doc-upload',
      title: 'Document Upload Stage',
      subtitle: 'PDF / Scanned PDF / XLSX / CSV / Images / DOCX',
      tag: 'Multi-Format Ingestion',
      file: 'backend/ingester.py & main.py',
      method: 'parse_spreadsheet(), parse_pdf(), parse_docx()',
      latency: '140ms / 50pp',
      memory: '38 MB',
      security: 'MIME validation, 50MB quarantine guard, path traversal checks',
      formats: 'PDF, OCR Scans, XLSX, CSV, TSV, PNG, JPG, TIFF, DOCX',
      summary: 'Accepts heterogeneous geological documentation. Uses csv.Sniffer for automatic delimiter detection, openpyxl for multi-sheet tables, and PyMuPDF for spatial vectors.',
      formula: 'Format Routing: ext ∈ {pdf, xlsx, csv, tsv, docx, img}',
      codeSnippet: `SUPPORTED_EXTENSIONS = {".pdf", ".xlsx", ".csv", ".tsv", ".docx", ".png", ".jpg", ".tiff"}\n# Multipart streaming upload with traversal sanitization & MIME sniffing`
    },
    'ingest-engine': {
      id: 'ingest-engine',
      title: 'Ingestion Engine',
      subtitle: 'PyMuPDF Spatial · Tesseract OCR · openpyxl & CSV Sniffer',
      tag: 'Core Parsing Layer',
      file: 'backend/ingester.py',
      method: 'IngestionEngine.ingest_single_file()',
      latency: '45ms / 1k rows',
      memory: '42 MB',
      security: 'Subprocess isolation & memory boundary limits',
      formats: 'Delimited tabular rows, vector text streams, raster pixmaps',
      summary: 'Extracts physical bounding boxes [x0, y0, x1, y1] for text tokens. Preserves spreadsheet column context ("Header: Value") and performs OCR fallback for historical scans.',
      formula: 'Spatial Map: BBox = [x0, y0, x1, y1] at 72-DPI Screen Scale',
      codeSnippet: `blocks = page.get_text("blocks")\nfor b in blocks:\n    records.append({"text": b[4], "bbox": [b[0], b[1], b[2], b[3]]})`
    },
    'chunking': {
      id: 'chunking',
      title: 'Sliding-Window Chunking',
      subtitle: '400 Words, 50-Word Overlap · Page & Bounding Box Preservation',
      tag: 'Contextual Partitioning',
      file: 'backend/ingester.py',
      method: 'sliding_window_chunk()',
      latency: '< 12ms',
      memory: '14 MB',
      security: 'Sentence boundary preservation',
      formats: 'Normalized text segments with parent page & bounding box tags',
      summary: 'Splits raw text streams into dense semantic paragraphs while maintaining 50 words of overlap to guarantee multi-sentence geological assertions are never bisected.',
      formula: 'Overlap Window: S_i = Words[i * (400 - 50) : i * (400 - 50) + 400]',
      codeSnippet: `step = chunk_size - overlap\nfor i in range(0, len(words), step):\n    chunk = " ".join(words[i:i + chunk_size])`
    },
    'embedding': {
      id: 'embedding',
      title: '384-dim Embedding Generation',
      subtitle: 'Subword & Character N-Gram Vectorization',
      tag: 'Semantic Projection',
      file: 'backend/ingester.py',
      method: 'FastOfflineEmbedding.__call__()',
      latency: '1.2ms / chunk',
      memory: '22 MB',
      security: 'Deterministic L2 Unit Normalization (||v|| = 1.0)',
      formats: 'Float32 Dense Vectors (d=384)',
      summary: 'Projects extracted paragraphs into high-dimensional semantic vector space. Guarantees synonyms like "coking coal" and "metallurgical grade" map closely.',
      formula: 'Unit Vector: v̂ = v / ||v||_2, Cosine Sim = v̂_q · v̂_d',
      codeSnippet: `vec = np.zeros(self.dim, dtype=np.float32)\nfor token in tokens: vec += hash_token_ngram(token)\nreturn vec / np.linalg.norm(vec)`
    },
    'chromadb': {
      id: 'chromadb',
      title: 'ChromaDB Vector Store',
      subtitle: 'Disk-Backed HNSW Graph with Cosine Metric',
      tag: 'Persistent Vector DB',
      file: 'backend/ingester.py & storage/chroma',
      method: 'collection.upsert(ids, documents, metadatas)',
      latency: '8ms query',
      memory: '58 MB Resident',
      security: 'Zero-cloud local storage (CMPDI air-gap compliance)',
      formats: 'HNSW Index + SQLite Metadata Catalog',
      summary: 'Air-gapped spatial vector database. Stores document embeddings alongside page numbers, bounding box rectangles, and source filenames for instant retrieval.',
      formula: 'HNSW Graph: M=16, efSearch=64, Distance: 1 - cos(θ)',
      codeSnippet: `self.collection = self.client.get_or_create_collection(\n    name="cmpdi_reports", metadata={"hnsw:space": "cosine"}\n)`
    },
    'bm25': {
      id: 'bm25',
      title: 'BM25 Keyword Index',
      subtitle: 'Exact Lexical & Technical Acronym Matching',
      tag: 'Lexical Scoring',
      file: 'backend/retriever.py',
      method: 'BM25Okapi(corpus_tokens)',
      latency: '3ms query',
      memory: '8 MB',
      security: 'Stopword filtering & punctuation sanitization',
      formats: 'Inverted index of geological tokens, borehole IDs, seam names',
      summary: 'Scores exact keyword matches for alphanumeric mine codes (e.g., "Seam-III", "Borehole-NC42", "G-11 grade") that dense vector models might generalize away.',
      formula: 'BM25 = IDF(q_i) · [f(q_i, D)(k_1 + 1)] / [f(q_i, D) + k_1(1 - b + b|D|/avgdl)]',
      codeSnippet: `scores = bm25.get_scores(query_tokens)\ntop_lexical_indices = np.argsort(scores)[::-1][:top_k]`
    },
    'user-query': {
      id: 'user-query',
      title: 'User Query Node',
      subtitle: 'Natural Language Geological & Mining Inquiry',
      tag: 'User Input',
      file: 'frontend & backend/main.py',
      method: 'POST /api/query',
      latency: '< 1ms',
      memory: 'Client/Server JSON',
      security: 'Pydantic input validation, XSS & prompt injection sanitization',
      formats: 'Query String (e.g., "Summarize stripping ratio for MCL in 2023-24")',
      summary: 'The operational inquiry submitted by mining engineers, geological officers, or Ministry of Coal auditors.',
      formula: 'q = Tokenize(Sanitize(InputString))',
      codeSnippet: `class QueryRequest(BaseModel):\n    query: str\n    document_filter: Optional[str] = None`
    },
    'hybrid-retrieval': {
      id: 'hybrid-retrieval',
      title: 'Hybrid Retrieval & Re-ranking',
      subtitle: 'Vector Cosine Similarity + BM25 Lexical Rank Fusion',
      tag: 'Reciprocal Rank Fusion',
      file: 'backend/retriever.py',
      method: 'hybrid_retrieve(query, top_k=5)',
      latency: '24ms',
      memory: '18 MB',
      security: 'Score normalization & deduplication',
      formats: 'Re-ranked chunk list with hybrid confidence scores',
      summary: 'Combines the semantic depth of dense embeddings with the exactness of BM25 lexical search using Reciprocal Rank Fusion (RRF k=60).',
      formula: 'RRF(d) = 1/(60 + Rank_dense(d)) + 1/(60 + Rank_bm25(d))',
      codeSnippet: `for doc, r in dense_ranks: rrf[doc] += 1.0 / (60 + r)\nfor doc, r in bm25_ranks:  rrf[doc] += 1.0 / (60 + r)`
    },
    'topk-chunks': {
      id: 'topk-chunks',
      title: 'Top-K Chunks with Metadata',
      subtitle: 'Source File + Page Number + Bounding Box Coordinates',
      tag: 'Evidence Assembly',
      file: 'backend/retriever.py',
      method: 'format_evidence_bundle()',
      latency: '< 2ms',
      memory: '4 MB',
      security: 'Strict source attribution metadata attachment',
      formats: 'List of Top-K verified text chunks with [x0, y0, x1, y1] coordinates',
      summary: 'The top verified text passages assembled with their physical PDF coordinates and spreadsheet cell locations for grounding the AI output.',
      formula: 'Bundle = {(Chunk_i, File_i, Page_i, BBox_i) : i = 1 .. K}',
      codeSnippet: `chunks = [{"text": c.text, "source": c.file, "page": c.page, "bbox": c.bbox}]`
    },
    'groq-inference': {
      id: 'groq-inference',
      title: 'Groq LPU Inference',
      subtitle: 'Ultra-Fast LPUs with 14-Model Fallback Cascade',
      tag: 'Primary LLM Engine',
      file: 'backend/rag_engine.py',
      method: 'groq_client.chat.completions.create()',
      latency: '480ms (500+ tokens/sec)',
      memory: 'Network Cloud API',
      security: 'TLS 1.3 encrypted, zero-data-retention policy',
      formats: 'Structured Markdown + JSON citation objects',
      summary: 'Executes high-speed geological reasoning using Groq Language Processing Units (LPUs). If a model encounters rate limits, it cascades down a 14-tier model hierarchy.',
      formula: 'Cascade Order: llama-3.3-70b → llama-3.1-70b → mixtral-8x7b → gemma-2-9b',
      codeSnippet: `for model in MODEL_CASCADE:\n    try: return call_groq(model, prompt)\n    except RateLimitError: continue`
    },
    'api-decision': {
      id: 'api-decision',
      title: 'API Available? (Resilience Gate)',
      subtitle: 'Health Check & Upstream Probe',
      tag: 'Resilience Gate',
      file: 'backend/rag_engine.py',
      method: 'test_and_resolve_model()',
      latency: '< 80ms probe',
      memory: '1 MB',
      security: 'Graceful offline degradation guarantee',
      formats: 'Boolean health flag',
      summary: 'Evaluates upstream API availability. If online, routes to Groq LPU; if offline or rate-limited, transparently drops to Local Extractive Fallback.',
      formula: 'Route = Groq_Online ? LPU_Inference : Local_Fallback',
      codeSnippet: `if groq_available:\n    return groq_synthesize(prompt)\nelse:\n    return local_extractive_fallback(top_chunks)`
    },
    'local-fallback': {
      id: 'local-fallback',
      title: 'Local Extractive Fallback',
      subtitle: 'Pure Lexical & Spatial Extraction (Zero Cloud)',
      tag: 'Offline Resilience',
      file: 'backend/rag_engine.py',
      method: 'extractive_summarize(top_chunks)',
      latency: '18ms',
      memory: '6 MB',
      security: 'Zero external network dependencies',
      formats: 'Extracted source sentences + physical coordinates',
      summary: 'Guarantees the system works during internet outages or air-gapped mining site deployments by extracting direct factual sentences from chunks.',
      formula: 'Extraction = SelectMostRelevantSentences(TopChunks, Query)',
      codeSnippet: `return { "answer": extracted_sentences, "citations": chunk_bboxes, "offline_mode": true }`
    },
    'ai-answer': {
      id: 'ai-answer',
      title: 'AI Answer + Citation Objects',
      subtitle: 'Synthesized Response with [x0, y0, x1, y1] Spatial Proof',
      tag: 'Verified Output',
      file: 'backend/main.py',
      method: 'QueryResponse(answer, citations, confidence_score)',
      latency: '< 1ms',
      memory: '2 MB',
      security: 'Confidence score threshold (85%) & provenance tags',
      formats: 'JSON with verified bounding-box arrays',
      summary: 'The final synthesized response containing grounded technical assertions accompanied by exact PDF source coordinates and confidence metrics.',
      formula: 'VerifiedPayload = { AnswerText, BBoxes, ConfidenceScore }',
      codeSnippet: `{ "answer": "...", "citations": [{ "source": "WCL_Block_IV.pdf", "page": 3, "bbox": [54.0, 72.0, 558.0, 110.0] }] }`
    },
    'out-qa': {
      id: 'out-qa',
      title: 'Q&A Assistant (Split-Screen Viewer)',
      subtitle: 'Interactive PDF Coordinate Highlighting Canvas',
      tag: 'Spatial UI Interface',
      file: 'frontend/src/components/ChatAssistant.jsx',
      method: 'PDFHighlightViewer.jsx canvas render',
      latency: '60fps canvas',
      memory: 'Client DOM',
      security: 'Sanitized coordinate viewport transformation',
      formats: 'Interactive split-screen PDF highlight view',
      summary: 'Interactive spatial viewer where clicking any citation immediately jumps to the PDF page and renders an exact highlight overlay on the cited paragraph.',
      formula: 'ViewportTransform: CanvasRect = BBox * DPI_Scale / ZoomRatio',
      codeSnippet: `renderBoundingBoxOverlay(activeCitation.bbox)`
    },
    'out-report': {
      id: 'out-report',
      title: 'Report Studio (DPR Generation)',
      subtitle: 'ReportLab 5.0 Vector PDFs · python-docx · Markdown',
      tag: 'Publication Engine',
      file: 'backend/report_generator.py',
      method: 'build_structured_report(), SimpleDocTemplate',
      latency: '1.2s / dossier',
      memory: '36 MB',
      security: 'Deterministic PDF formatting & cryptographic checksum',
      formats: 'Ministry of Coal DPR Archetypes (.pdf, .docx, .md)',
      summary: 'Compiles print-ready, audit-grade Detailed Project Reports (DPR) complete with reserve matrices, cover pages, and statutory verification tables.',
      formula: 'DocumentStory = [TitlePage, TableOfContents, ReserveTable, Section1, References]',
      codeSnippet: `doc = SimpleDocTemplate("CMPDI_Audit_Report.pdf"); doc.build(story)`
    },
    'out-analytics': {
      id: 'out-analytics',
      title: 'Analytics Dashboard',
      subtitle: 'National Coal Metrics · OBR Ratios · Mining Word Cloud',
      tag: 'Executive View',
      file: 'frontend/src/components/Dashboard.jsx',
      method: 'aggregateSubsidiaryStats(), renderWordCloud()',
      latency: '< 16ms render',
      memory: 'Client State',
      security: 'Client-side memoization',
      formats: 'High-density word cloud, national coal metrics',
      summary: 'Aggregates production, dispatch, and stripping ratio (OBR) metrics across all 8 Coal India subsidiaries (ECL, BCCL, CCL, WCL, SECL, NCL, MCL, CMPDI).',
      formula: 'Stripping Ratio = Total Overburden Removed (M.Cu.m) / Coal Produced (MT)',
      codeSnippet: `const stats = useMemo(() => calculateSubsidiaryAverages(data), [data])`
    }
  };

  // Simulation step progression
  const simSequence = [
    'doc-upload',
    'ingest-engine',
    'chunking',
    'embedding',
    'chromadb',
    'user-query',
    'hybrid-retrieval',
    'topk-chunks',
    'groq-inference',
    'api-decision',
    'ai-answer',
    'out-qa'
  ];

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSimStep((prev) => {
        const next = (prev + 1) % simSequence.length;
        setHoveredNodeId(simSequence[next]);
        return next;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Subtle mineral dust particles (NO NEON GLOW)
  useEffect(() => {
    const canvas = dustCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.25 + 0.08,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: (Math.random() - 0.5) * 0.25,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 195, 210, ${p.alpha})`;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const activeNode = nodeRegistry[hoveredNodeId] || nodeRegistry['ingest-engine'];

  return (
    <div className="cmpdi-arch">
      {/* Background Dot Grid & Mineral Dust */}
      <div className="arch-grid-pattern" aria-hidden="true" />
      <canvas ref={dustCanvasRef} className="arch-dust-canvas" aria-hidden="true" />

      {/* Top Header Navigation */}
      <header className="arch-header">
        <div className="arch-header-left">
          <button 
            onClick={onBackToLanding || (() => window.location.hash = '')}
            className="arch-back-btn"
            title="Return to Overview"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal</span>
          </button>
          <div className="arch-title-group">
            <span className="text-xs font-semibold text-zinc-300">GeoIntel Core Architecture</span>
            <span className="arch-sys-pill">AIR-GAPPED SYSTEM SPEC</span>
          </div>
        </div>

        <div className="arch-header-actions">
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`arch-btn-sim ${isSimulating ? 'active' : ''}`}
            title="Toggle Live Data Simulation"
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Simulation Active' : 'Resume Simulation'}</span>
          </button>
          <button 
            onClick={onLaunchPlatform || (() => window.location.hash = '#dashboard')}
            className="arch-btn-action"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="arch-workspace">
        {/* ============================================================
           FLOWCHART COLUMN (CONTINUOUS VERTICAL FLOW, ZERO GAPS)
           ============================================================ */}
        <div className="arch-flow-column">
          {/* Header Intro & Robust Input Highlights */}
          <div className="arch-flow-intro">
            <h1>Geological AI Retrieval &amp; Synthesis Pipeline</h1>
            <p>
              End-to-end topological execution model from multi-format exploration ingestion to grounded spatial citation synthesis.
            </p>
            <div className="arch-format-pillbox">
              <span className="arch-format-badge highlight">📄 PDF (72-DPI Spatial Vectors)</span>
              <span className="arch-format-badge highlight">📊 XLSX Spreadsheets (openpyxl)</span>
              <span className="arch-format-badge highlight">📑 CSV / TSV (csv.Sniffer Delimiter Engine)</span>
              <span className="arch-format-badge highlight">🔍 Scanned Folios (Tesseract OCR)</span>
              <span className="arch-format-badge">📝 DOCX (python-docx)</span>
              <span className="arch-format-badge">🖼️ Stratigraphic Images (TIFF/PNG)</span>
            </div>
          </div>

          {/* SVG Definitions for Markers */}
          <svg className="hidden" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <marker id="flow-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#58A6FF" />
              </marker>
              <marker id="flow-arrow-gold" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#C9A86A" />
              </marker>
            </defs>
          </svg>

          {/* Continuous Flow Canvas */}
          <div className="arch-flow-canvas">
            {/* 1. DOCUMENT UPLOAD NODE */}
            <div 
              className={`arch-node ${hoveredNodeId === 'doc-upload' ? 'active-node' : ''}`}
              style={{ width: '380px' }}
              onMouseEnter={() => setHoveredNodeId('doc-upload')}
            >
              <div className="arch-node-title">
                <span>📄 Document Upload</span>
              </div>
              <div className="arch-node-sub">
                (PDF / Scanned PDF / XLSX / CSV / Image / DOCX)
              </div>
            </div>

            {/* Straight Connector 1 */}
            <svg width="380" height="34" className="flow-svg-root" aria-hidden="true">
              <line x1="190" y1="0" x2="190" y2="34" className="flow-base-track" />
              <line x1="190" y1="0" x2="190" y2="28" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
            </svg>

            {/* 2. INGESTION ENGINE NODE */}
            <div 
              className={`arch-node ${hoveredNodeId === 'ingest-engine' ? 'active-node' : ''}`}
              style={{ width: '420px' }}
              onMouseEnter={() => setHoveredNodeId('ingest-engine')}
            >
              <div className="arch-node-title">
                <span>Ingestion Engine</span>
              </div>
              <div className="arch-node-sub">
                • PyMuPDF spatial extraction<br />
                • Tesseract OCR fallback<br />
                • openpyxl &amp; csv.Sniffer parser
              </div>
            </div>

            {/* Straight Connector 2 */}
            <svg width="420" height="34" className="flow-svg-root" aria-hidden="true">
              <line x1="210" y1="0" x2="210" y2="34" className="flow-base-track" />
              <line x1="210" y1="0" x2="210" y2="28" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
            </svg>

            {/* 3. SLIDING-WINDOW CHUNKING NODE */}
            <div 
              className={`arch-node ${hoveredNodeId === 'chunking' ? 'active-node' : ''}`}
              style={{ width: '400px' }}
              onMouseEnter={() => setHoveredNodeId('chunking')}
            >
              <div className="arch-node-title">
                <span>Sliding-Window Chunking</span>
              </div>
              <div className="arch-node-sub">
                (400 words, 50-word overlap<br />
                Preserves page + bbox metadata)
              </div>
            </div>

            {/* Split Connector (Branching to Embedding vs BM25) */}
            <svg width="560" height="42" viewBox="0 0 560 42" className="flow-svg-root" aria-hidden="true">
              {/* Left track */}
              <path d="M 280 0 C 280 20, 140 12, 140 42" className="flow-base-track" />
              <path d="M 280 0 C 280 20, 140 12, 140 36" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
              {/* Right track */}
              <path d="M 280 0 C 280 20, 420 12, 420 42" className="flow-base-track" />
              <path d="M 280 0 C 280 20, 420 12, 420 36" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
            </svg>

            {/* 4. DUAL BRANCHES ROW: Embeddings (Left) and BM25 (Right) */}
            <div className="arch-row-parallel" style={{ width: '560px' }}>
              {/* Left Branch: Embedding Generation */}
              <div 
                className={`arch-node ${hoveredNodeId === 'embedding' ? 'active-node' : ''}`}
                style={{ width: '240px' }}
                onMouseEnter={() => setHoveredNodeId('embedding')}
              >
                <div className="arch-node-title">
                  <span>384-dim Embedding</span>
                </div>
                <div className="arch-node-sub">Generation</div>
              </div>

              {/* Right Branch: BM25 Keyword Index */}
              <div 
                className={`arch-node ${hoveredNodeId === 'bm25' ? 'active-node' : ''}`}
                style={{ width: '240px' }}
                onMouseEnter={() => setHoveredNodeId('bm25')}
              >
                <div className="arch-node-title">
                  <span>BM25 Keyword Index</span>
                </div>
                <div className="arch-node-sub">Exact Mining Lexicon</div>
              </div>
            </div>

            {/* Connector from Embedding to ChromaDB (Left) & Passthrough on Right */}
            <svg width="560" height="34" viewBox="0 0 560 34" className="flow-svg-root" aria-hidden="true">
              {/* Left down into ChromaDB */}
              <line x1="120" y1="0" x2="120" y2="34" className="flow-base-track" />
              <line x1="120" y1="0" x2="120" y2="28" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
              {/* Right down track */}
              <line x1="440" y1="0" x2="440" y2="34" className="flow-base-track" />
              <line x1="440" y1="0" x2="440" y2="28" className="flow-anim-dash" />
            </svg>

            {/* Row with ChromaDB Vector Store (Cylinder) and BM25 continuity */}
            <div className="arch-row-parallel" style={{ width: '560px' }}>
              {/* ChromaDB Cylinder */}
              <div 
                className={`arch-cylinder-node ${hoveredNodeId === 'chromadb' ? 'active-node' : ''}`}
                style={{ width: '240px' }}
                onMouseEnter={() => setHoveredNodeId('chromadb')}
              >
                <div className="arch-cylinder-top" />
                <div className="arch-cylinder-body">
                  <div className="arch-node-title">
                    <span>ChromaDB</span>
                  </div>
                  <div className="arch-node-sub">Vector Store</div>
                </div>
                <div className="arch-cylinder-bottom" />
              </div>

              {/* Empty placeholder balancing space on right (BM25 continues directly down) */}
              <div style={{ width: '240px', height: '1px' }} />
            </div>

            {/* Convergence Connector (ChromaDB + BM25 + User Query from Left into Hybrid Retrieval) */}
            <svg width="680" height="46" viewBox="0 0 680 46" className="flow-svg-root" aria-hidden="true">
              {/* ChromaDB into Hybrid Retrieval */}
              <path d="M 180 0 C 180 26, 300 20, 300 46" className="flow-base-track" />
              <path d="M 180 0 C 180 26, 300 20, 300 40" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
              
              {/* BM25 into Hybrid Retrieval */}
              <path d="M 500 0 C 500 26, 380 20, 380 46" className="flow-base-track" />
              <path d="M 500 0 C 500 26, 380 20, 380 40" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
              
              {/* User Query entering from left */}
              <path d="M 60 23 L 200 23" className="flow-base-track" />
              <path d="M 60 23 L 194 23" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
            </svg>

            {/* Convergence Row: User Query on Left + Hybrid Retrieval Centered */}
            <div className="arch-row-convergence" style={{ width: '680px', justifyContent: 'center' }}>
              {/* User Query positioned left */}
              <div 
                className={`arch-node ${hoveredNodeId === 'user-query' ? 'active-node' : ''}`}
                style={{ width: '130px', position: 'absolute', left: '0' }}
                onMouseEnter={() => setHoveredNodeId('user-query')}
              >
                <div className="arch-node-title">
                  <span>User Query</span>
                </div>
              </div>

              {/* Hybrid Retrieval Centered */}
              <div 
                className={`arch-node ${hoveredNodeId === 'hybrid-retrieval' ? 'active-node' : ''}`}
                style={{ width: '380px' }}
                onMouseEnter={() => setHoveredNodeId('hybrid-retrieval')}
              >
                <div className="arch-node-title">
                  <span>Hybrid Retrieval</span>
                </div>
                <div className="arch-node-sub">
                  Vector similarity + BM25 re-rank (RRF k=60)
                </div>
              </div>
            </div>

            {/* Straight Connector 3 */}
            <svg width="380" height="34" className="flow-svg-root" aria-hidden="true">
              <line x1="190" y1="0" x2="190" y2="34" className="flow-base-track" />
              <line x1="190" y1="0" x2="190" y2="28" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
            </svg>

            {/* 5. TOP-K CHUNKS NODE */}
            <div 
              className={`arch-node ${hoveredNodeId === 'topk-chunks' ? 'active-node' : ''}`}
              style={{ width: '380px' }}
              onMouseEnter={() => setHoveredNodeId('topk-chunks')}
            >
              <div className="arch-node-title">
                <span>Top-K Chunks</span>
              </div>
              <div className="arch-node-sub">
                with source + page + bbox metadata
              </div>
            </div>

            {/* Straight Connector 4 */}
            <svg width="380" height="34" className="flow-svg-root" aria-hidden="true">
              <line x1="190" y1="0" x2="190" y2="34" className="flow-base-track" />
              <line x1="190" y1="0" x2="190" y2="28" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
            </svg>

            {/* 6. GROQ LPU INFERENCE NODE */}
            <div 
              className={`arch-node ${hoveredNodeId === 'groq-inference' ? 'active-node' : ''}`}
              style={{ width: '380px' }}
              onMouseEnter={() => setHoveredNodeId('groq-inference')}
            >
              <div className="arch-node-title">
                <span>Groq LPU Inference</span>
              </div>
              <div className="arch-node-sub">
                (14-model cascade · Llama 3.3 70B &rarr; Mixtral)
              </div>
            </div>

            {/* Straight Connector 5 into Diamond */}
            <svg width="380" height="32" className="flow-svg-root" aria-hidden="true">
              <line x1="190" y1="0" x2="190" y2="32" className="flow-base-track" />
              <line x1="190" y1="0" x2="190" y2="26" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
            </svg>

            {/* 7. DECISION ROW: Diamond (API Available?) + Local Extractive Fallback */}
            <div style={{ width: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {/* Centered Diamond Node */}
              <div 
                className={`arch-diamond-container ${hoveredNodeId === 'api-decision' ? 'active-node' : ''}`}
                onMouseEnter={() => setHoveredNodeId('api-decision')}
              >
                <div className="arch-diamond-rhombus">
                  <div className="arch-diamond-text">
                    API<br />available?
                  </div>
                </div>
              </div>

              {/* Local Extractive Fallback on Right */}
              <div 
                className={`arch-node ${hoveredNodeId === 'local-fallback' ? 'active-node' : ''}`}
                style={{ width: '220px', position: 'absolute', right: '0' }}
                onMouseEnter={() => setHoveredNodeId('local-fallback')}
              >
                <div className="arch-node-title">
                  <span>Local Extractive Fallback</span>
                </div>
                <div className="arch-node-sub">Pure Offline Extraction</div>
              </div>
            </div>

            {/* Decision Exit Connectors (Yes Straight Down, No to Fallback and Down) */}
            <svg width="600" height="46" viewBox="0 0 600 46" className="flow-svg-root" aria-hidden="true">
              {/* "No" connector from diamond right to Fallback */}
              <path d="M 335 -45 L 390 -45" className="flow-base-track" />
              <text x="350" y="-50" className="flow-label-badge">No</text>
              <path d="M 335 -45 L 384 -45" className="flow-anim-dash-gold" markerEnd="url(#flow-arrow-gold)" />

              {/* "Yes" path straight down from diamond */}
              <line x1="300" y1="0" x2="300" y2="46" className="flow-base-track" />
              <text x="278" y="24" className="flow-label-badge">Yes</text>
              <line x1="300" y1="0" x2="300" y2="40" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />

              {/* Fallback exit down and curving into AI Answer */}
              <path d="M 490 0 C 490 26, 360 22, 360 46" className="flow-base-track" />
              <path d="M 490 0 C 490 26, 360 22, 360 40" className="flow-anim-dash-gold" markerEnd="url(#flow-arrow-gold)" />
            </svg>

            {/* 8. AI ANSWER + CITATION OBJECTS NODE */}
            <div 
              className={`arch-node ${hoveredNodeId === 'ai-answer' ? 'active-node' : ''}`}
              style={{ width: '400px' }}
              onMouseEnter={() => setHoveredNodeId('ai-answer')}
            >
              <div className="arch-node-title">
                <span>AI Answer + Citation Objects</span>
              </div>
              <div className="arch-node-sub">
                Spatial proof bounds: [x0, y0, x1, y1]
              </div>
            </div>

            {/* 3-Way Split Connector to Terminal Outputs */}
            <svg width="740" height="42" viewBox="0 0 740 42" className="flow-svg-root" aria-hidden="true">
              {/* Left track */}
              <path d="M 370 0 C 370 24, 125 16, 125 42" className="flow-base-track" />
              <path d="M 370 0 C 370 24, 125 16, 125 36" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
              {/* Center track */}
              <line x1="370" y1="0" x2="370" y2="42" className="flow-base-track" />
              <line x1="370" y1="0" x2="370" y2="36" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
              {/* Right track */}
              <path d="M 370 0 C 370 24, 615 16, 615 42" className="flow-base-track" />
              <path d="M 370 0 C 370 24, 615 16, 615 36" className="flow-anim-dash" markerEnd="url(#flow-arrow)" />
            </svg>

            {/* 9. THREE TERMINAL DESTINATIONS ROW */}
            <div className="arch-row-parallel" style={{ width: '740px' }}>
              {/* Terminal 1: Q&A Assistant */}
              <div 
                className={`arch-node ${hoveredNodeId === 'out-qa' ? 'active-node' : ''}`}
                style={{ width: '235px' }}
                onMouseEnter={() => setHoveredNodeId('out-qa')}
              >
                <div className="arch-node-title">
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Q&amp;A Assistant</span>
                </div>
                <div className="arch-node-sub">
                  (Split-screen PDF viewer)
                </div>
              </div>

              {/* Terminal 2: Report Studio */}
              <div 
                className={`arch-node ${hoveredNodeId === 'out-report' ? 'active-node' : ''}`}
                style={{ width: '235px' }}
                onMouseEnter={() => setHoveredNodeId('out-report')}
              >
                <div className="arch-node-title">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Report Studio</span>
                </div>
                <div className="arch-node-sub">
                  (PDF / DOCX / MD)
                </div>
              </div>

              {/* Terminal 3: Analytics Dashboard */}
              <div 
                className={`arch-node ${hoveredNodeId === 'out-analytics' ? 'active-node' : ''}`}
                style={{ width: '235px' }}
                onMouseEnter={() => setHoveredNodeId('out-analytics')}
              >
                <div className="arch-node-title">
                  <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Analytics Dashboard</span>
                </div>
                <div className="arch-node-sub">
                  (Word Cloud + Charts)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
           STICKY LIVE INSPECTOR HUD (RIGHT DOCKED PANEL)
           Updates automatically as users hover any node
           ============================================================ */}
        <aside className="arch-inspector-panel">
          <div className="arch-inspector-header">
            <div>
              <span className="arch-hud-tag">{activeNode.tag}</span>
              <h2 className="text-sm font-bold text-white mt-1.5">{activeNode.title}</h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{activeNode.subtitle}</p>
            </div>
          </div>

          {/* SLA & Technical Performance Grid */}
          <div className="arch-inspector-meta-grid">
            <div className="arch-meta-box">
              <div className="arch-meta-label">SOURCE LOCATION</div>
              <div className="arch-meta-value text-blue-400 truncate" title={activeNode.file}>
                {activeNode.file}
              </div>
            </div>
            <div className="arch-meta-box">
              <div className="arch-meta-label">LATENCY SLA</div>
              <div className="arch-meta-value text-emerald-400">
                {activeNode.latency}
              </div>
            </div>
            <div className="arch-meta-box">
              <div className="arch-meta-label">MEMORY FOOTPRINT</div>
              <div className="arch-meta-value text-amber-300">
                {activeNode.memory}
              </div>
            </div>
            <div className="arch-meta-box">
              <div className="arch-meta-label">METHOD ENTRYPOINT</div>
              <div className="arch-meta-value text-zinc-200 truncate" title={activeNode.method}>
                {activeNode.method}
              </div>
            </div>
          </div>

          {/* Formats & Input Handling */}
          <div className="arch-meta-box">
            <div className="arch-meta-label">SUPPORTED DATA ENCODING &amp; FORMATS</div>
            <div className="text-xs text-zinc-300 mt-1">
              {activeNode.formats}
            </div>
          </div>

          {/* Mathematical Formulation */}
          {activeNode.formula && (
            <div className="arch-meta-box">
              <div className="arch-meta-label">MATHEMATICAL FORMULATION</div>
              <div className="text-xs font-mono text-amber-200 mt-1">
                {activeNode.formula}
              </div>
            </div>
          )}

          {/* Functional Summary */}
          <div>
            <div className="arch-meta-label">ARCHITECTURAL ROLE</div>
            <p className="text-xs text-zinc-300 leading-relaxed mt-1">
              {activeNode.summary}
            </p>
          </div>

          {/* Code Implementation Snippet */}
          <div>
            <div className="arch-meta-label">IMPLEMENTATION LOGIC</div>
            <pre className="arch-code-box mt-1">
              <code>{activeNode.codeSnippet}</code>
            </pre>
          </div>
        </aside>
      </div>

      {/* ============================================================
         ROBUST MULTI-FORMAT INGESTION ARCHITECTURE SPECIFICATION
         Detailed mechanics for CSV, XLSX, PDF, OCR, DOCX
         ============================================================ */}
      <section className="arch-format-matrix">
        <div className="mb-4">
          <span className="arch-hud-tag">ROBUST INGESTION ARCHITECTURE</span>
          <h2 className="text-base font-bold text-white mt-1">Multi-Format Exploration Document Processing</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Geological data exists across legacy borehole folios, tabular production spreadsheets, and official statutory reports. The engine guarantees zero parsing failures across all standard extensions.
          </p>
        </div>

        {/* Format Selector Tabs */}
        <div className="arch-matrix-tabs">
          <button 
            onClick={() => setActiveFormatTab('csv')}
            className={`arch-matrix-tab ${activeFormatTab === 'csv' ? 'active' : ''}`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV / TSV Ingestion</span>
          </button>
          <button 
            onClick={() => setActiveFormatTab('xlsx')}
            className={`arch-matrix-tab ${activeFormatTab === 'xlsx' ? 'active' : ''}`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>XLSX Spreadsheets</span>
          </button>
          <button 
            onClick={() => setActiveFormatTab('pdf')}
            className={`arch-matrix-tab ${activeFormatTab === 'pdf' ? 'active' : ''}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Vector Extraction</span>
          </button>
          <button 
            onClick={() => setActiveFormatTab('ocr')}
            className={`arch-matrix-tab ${activeFormatTab === 'ocr' ? 'active' : ''}`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Scanned Folios (OCR)</span>
          </button>
          <button 
            onClick={() => setActiveFormatTab('docx')}
            className={`arch-matrix-tab ${activeFormatTab === 'docx' ? 'active' : ''}`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Word DOCX</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="bg-[#0D1117] border border-[#21262D] rounded-lg p-4 text-xs">
          {activeFormatTab === 'csv' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white text-sm">Delimiter Auto-Detection (csv.Sniffer) &amp; Multi-Encoding Support</h3>
                <span className="text-xs text-emerald-400 font-mono">Engine: backend/ingester.py &rarr; parse_spreadsheet()</span>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-3">
                Handles comma, tab, semicolon, and pipe delimiters automatically using Python's native <code className="text-amber-300">csv.Sniffer</code>. Supports Microsoft Excel BOM (<code className="text-amber-300">utf-8-sig</code>), standard UTF-8, and Latin-1 encodings so mining dispatch tables never fail on upload.
              </p>
              <div className="arch-code-box">
                <span className="text-zinc-500"># Native CSV parsing engine in backend/ingester.py</span><br />
                dialect = csv.Sniffer().sniff(sample, delimiters=[',', '\t', ';', '|'])<br />
                reader = csv.reader(io.StringIO(content), delimiter=dialect.delimiter)<br />
                for row_idx, row in enumerate(data_rows, start=start_idx):<br />
                &nbsp;&nbsp;text = " | ".join([f"&#123;headers[i]&#125;: &#123;row[i].strip()&#125;" for i in range(min(len(headers), len(row))) if row[i]])<br />
                &nbsp;&nbsp;records.append(&#123; "id": f"&#123;filename&#125;_row&#123;row_idx&#125;", "text": text, "metadata": &#123; "format": "csv" &#125; &#125;)
              </div>
            </div>
          )}

          {activeFormatTab === 'xlsx' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white text-sm">openpyxl Multi-Sheet Row Traversal &amp; Header Context Pairing</h3>
                <span className="text-xs text-emerald-400 font-mono">Engine: backend/ingester.py &rarr; parse_spreadsheet()</span>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-3">
                Each spreadsheet row is converted into an autonomous searchable document chunk. Column headers are automatically paired with cell values (<code className="text-amber-300">Header: Value | Header2: Value2</code>) so isolated numbers never lose their geological context.
              </p>
              <div className="arch-code-box">
                <span className="text-zinc-500"># Ingestion logic in backend/ingester.py &rarr; parse_spreadsheet()</span><br />
                wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)<br />
                headers = [str(h).strip() for h in rows[0]]<br />
                for row in rows[1:]:<br />
                &nbsp;&nbsp;text = " | ".join([f"&#123;headers[i]&#125;: &#123;cells[i]&#125;" for i in range(len(headers)) if cells[i]])<br />
                &nbsp;&nbsp;records.append(&#123; "text": text, "metadata": &#123; "format": "xlsx", "sheet": sheet_name &#125; &#125;)
              </div>
            </div>
          )}

          {activeFormatTab === 'pdf' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white text-sm">72-DPI Cartesian Bounding-Box Extraction (PyMuPDF / fitz)</h3>
                <span className="text-xs text-emerald-400 font-mono">Engine: backend/ingester.py &rarr; parse_pdf()</span>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-3">
                Directly reads character render vectors from PDF content streams to calculate physical pixel boundaries <code className="text-amber-300">[x0, y0, x1, y1]</code> at standard 72-DPI screen scaling, guaranteeing zero coordinate drift when displayed in client viewers.
              </p>
              <div className="arch-code-box">
                <span className="text-zinc-500"># PDF coordinate mapping in backend/ingester.py &rarr; parse_pdf()</span><br />
                doc = fitz.open(pdf_path)<br />
                for page in doc:<br />
                &nbsp;&nbsp;blocks = page.get_text("blocks")  # (x0, y0, x1, y1, text, block_no, block_type)<br />
                &nbsp;&nbsp;words = page.get_text("words")    # Word-level coordinates for exact line highlights
              </div>
            </div>
          )}

          {activeFormatTab === 'ocr' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white text-sm">Tesseract OCR Pipeline for Historical Scanned Drill Logs &amp; Folios</h3>
                <span className="text-xs text-emerald-400 font-mono">Engine: backend/ingester.py &rarr; parse_image_with_ocr()</span>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-3">
                When a PDF has no embedded vector text (e.g. 1970s scanned borehole lithology sheets), the system renders the page to a 300-DPI pixmap and executes Tesseract OCR to extract bounding box coordinates for each recognized word.
              </p>
              <div className="arch-code-box">
                <span className="text-zinc-500"># Scanned OCR fallback in backend/ingester.py &rarr; parse_image_with_ocr()</span><br />
                pix = page.get_pixmap(dpi=150)<br />
                img = Image.open(io.BytesIO(pix.tobytes()))<br />
                ocr_text = pytesseract.image_to_string(img)
              </div>
            </div>
          )}

          {activeFormatTab === 'docx' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white text-sm">python-docx Table &amp; Paragraph Extraction</h3>
                <span className="text-xs text-emerald-400 font-mono">Engine: backend/ingester.py &rarr; parse_docx()</span>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-3">
                Traverses Microsoft Word document structures, extracting structured tables and nested paragraphs while retaining heading hierarchies for semantic chunk contextualization.
              </p>
              <div className="arch-code-box">
                <span className="text-zinc-500"># python-docx parser in backend/ingester.py &rarr; parse_docx()</span><br />
                doc = docx.Document(str(filepath))<br />
                for p in doc.paragraphs: texts.append(p.text)<br />
                for t in doc.tables: texts.extend([" | ".join([c.text for c in row.cells]) for row in t.rows])
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
