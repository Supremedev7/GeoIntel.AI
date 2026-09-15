import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderArchive, Upload, RefreshCw, FileText, Download, 
  CheckCircle2, Terminal, AlertCircle, Eye, Layers, ShieldCheck,
  HardDrive, FileSpreadsheet, Plus, X, ArrowUpRight
} from 'lucide-react';

export default function Repository({ 
  availableFiles = [], 
  onRefresh, 
  onSelectForAudit 
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Scraper Modal & Logs
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState([]);
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const logsEndRef = useRef(null);

  // Fetch scrape logs periodically if modal open
  useEffect(() => {
    let interval = null;
    if (showScrapeModal) {
      const fetchLogs = async () => {
        try {
          const resp = await fetch('/api/scrape-logs');
          if (resp.ok) {
            const data = await resp.json();
            setScrapeLogs(data.logs || []);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchLogs();
      interval = setInterval(fetchLogs, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showScrapeModal]);

  // Autoscroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scrapeLogs]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const SUPPORTED_EXTS = ['.pdf', '.xlsx', '.xls', '.csv', '.tsv', '.docx', '.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp'];

  const uploadFile = async (file) => {
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!SUPPORTED_EXTS.includes(fileExt)) {
      setUploadError(`Unsupported file format "${fileExt}". Supported: PDF, XLSX, CSV, TSV, DOCX, and Geological Images.`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => null);
        throw new Error(errorData?.detail || `Upload failed with status ${resp.status}`);
      }

      const res = await resp.json();
      setUploadSuccess(`Successfully ingested "${res.filename}" (${res.format || 'Document'}, ${res.chunks_indexed} spatial vectors indexed) • Library updated to ${res.total_documents} documents (${res.total_vectors} vectors)`);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const triggerLiveScraper = async () => {
    setShowScrapeModal(true);
    setIsScrapingActive(true);
    try {
      await fetch('/api/trigger-scrape', { method: 'POST' });
    } catch (e) {
      console.error("Trigger scrape failed:", e);
    } finally {
      setTimeout(() => setIsScrapingActive(false), 8000);
    }
  };

  const totalPages = availableFiles.reduce((acc, f) => acc + (typeof f === 'object' && f !== null ? (f.pages || 0) : 0), 0);
  const totalChunks = availableFiles.reduce((acc, f) => acc + (typeof f === 'object' && f !== null ? (f.chunks || 0) : 0), 0);
  const totalSizeKB = availableFiles.reduce((acc, f) => acc + (typeof f === 'object' && f !== null ? (f.size_kb || 0) : 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Stats & Action Buttons */}
      <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-2 border border-accent/20">
              <HardDrive className="w-3.5 h-3.5" /> Ministry & CMPDI Ingestion Harness
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Official Document Repository & Ingestion Hub
            </h1>
            <p className="text-xs text-text-secondary mt-1 max-w-2xl">
              Houses full-length public annual reports, mine plan guidelines, and geological volumes. All documents are parsed into high-dimensional ChromaDB vectors with PyMuPDF spatial coordinates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerLiveScraper}
              className="bg-accent hover:bg-accent-hover text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-accent/25 flex items-center gap-2 text-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Trigger Web Scraper</span>
            </button>
          </div>
        </div>

        {/* Repository Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-border">
          <div className="bg-surface-0 p-3 rounded-xl border border-border">
            <div className="text-[10px] uppercase font-bold text-text-tertiary">Total Documents</div>
            <div className="text-xl font-extrabold text-text-primary mt-0.5">{availableFiles.length}</div>
          </div>
          <div className="bg-surface-0 p-3 rounded-xl border border-border">
            <div className="text-[10px] uppercase font-bold text-text-tertiary">Total Scanned Pages</div>
            <div className="text-xl font-extrabold text-accent mt-0.5">{totalPages}</div>
          </div>
          <div className="bg-surface-0 p-3 rounded-xl border border-border">
            <div className="text-[10px] uppercase font-bold text-text-tertiary">Indexed ChromaDB Vectors</div>
            <div className="text-xl font-extrabold text-status-success mt-0.5">{totalChunks}</div>
          </div>
          <div className="bg-surface-0 p-3 rounded-xl border border-border">
            <div className="text-[10px] uppercase font-bold text-text-tertiary">Repository Volume</div>
            <div className="text-xl font-extrabold text-amber mt-0.5">{(totalSizeKB / 1024).toFixed(2)} MB</div>
          </div>
        </div>
      </div>

      {/* Drag and Drop Upload Zone */}
      <div
        id="tour-upload-zone"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragActive
            ? 'border-accent bg-accent/10 scale-[1.01]'
            : 'border-border bg-surface-0 hover:border-accent/40'
        }`}
      >
        <input
          type="file"
          id="pdfUploadInput"
          accept=".pdf,.xlsx,.xls,.csv,.tsv,.docx,.png,.jpg,.jpeg,.tiff,.tif,.bmp"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              uploadFile(e.target.files[0]);
              e.target.value = '';
            }
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            {uploading ? (
              <RefreshCw className="w-6 h-6 animate-spin text-accent" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-text-primary">
              {uploading ? 'Parsing Exploration Document & Indexing Vectors...' : 'Drag & Drop Exploration Documents, Spreadsheets & Maps Here'}
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5">
              Supports Geological PDFs, Mining Spreadsheets (CSV/XLSX), Borehole Folios, DOCX &amp; Stratigraphic Maps.
            </p>
          </div>

          <label
            htmlFor="pdfUploadInput"
            className="cursor-pointer bg-surface-2 hover:bg-surface-3 text-text-primary text-xs font-semibold px-4 py-2 rounded-xl border border-border transition-colors shadow-sm"
          >
            Browse Files from Computer
          </label>
        </div>
      </div>

      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 bg-status-success/10 border border-status-success/30 text-status-success rounded-xl text-xs">
          <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-status-error/10 border border-status-error/30 text-status-error rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 text-status-error shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Grid of All Scraped & Uploaded Documents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-text-tertiary px-1">
          <span className="font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <FolderArchive className="w-4 h-4 text-accent" /> Ingested Exploration Library ({availableFiles.length})
          </span>
          <span>PDFs, Spreadsheets (CSV/XLSX), Borehole Folios &amp; Reports</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableFiles.map((doc, idx) => {
            const fname = typeof doc === 'string' ? doc : (doc?.filename || `Document_${idx}`);
            const pages = typeof doc === 'object' && doc !== null ? (doc?.pages || 1) : 1;
            const size_kb = typeof doc === 'object' && doc !== null ? (doc?.size_kb || 0) : 0;
            const chunks = typeof doc === 'object' && doc !== null ? (doc?.chunks || 0) : 0;
            const upload_date = typeof doc === 'object' && doc !== null ? (doc?.upload_date || 'Ready') : 'Ready';
            const url = typeof doc === 'object' && doc !== null ? (doc?.url || `/api/pdf-raw/${fname}`) : `/api/pdf-raw/${fname}`;
            const isSheet = fname.toLowerCase().endsWith('.csv') || fname.toLowerCase().endsWith('.xlsx') || fname.toLowerCase().endsWith('.tsv') || fname.toLowerCase().endsWith('.xls');
            const isImg = fname.toLowerCase().endsWith('.png') || fname.toLowerCase().endsWith('.jpg') || fname.toLowerCase().endsWith('.jpeg') || fname.toLowerCase().endsWith('.tiff') || fname.toLowerCase().endsWith('.tif') || fname.toLowerCase().endsWith('.bmp');
            const formatTag = doc?.format || (isSheet ? 'SHEET' : isImg ? 'IMAGE' : 'PDF');

            return (
              <div
                key={fname || idx}
                className="bg-surface-1 border border-border rounded-2xl p-5 shadow-sm space-y-3 hover:border-border-hover transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      {isSheet ? (
                        <FileSpreadsheet className="w-5 h-5 text-accent" />
                      ) : isImg ? (
                        <Layers className="w-5 h-5 text-accent" />
                      ) : (
                        <FileText className="w-5 h-5 text-accent" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-surface-2 text-text-secondary font-mono px-2 py-0.5 rounded border border-border">
                        {formatTag}
                      </span>
                      <span className="text-[10px] bg-status-success/15 text-status-success font-semibold px-2 py-0.5 rounded-full border border-status-success/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Indexed
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-text-primary line-clamp-2" title={fname}>
                      {fname}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-text-tertiary mt-1">
                      {!isSheet && !isImg && (
                        <>
                          <span className="text-accent font-semibold">{pages} Pages</span>
                          <span>&bull;</span>
                        </>
                      )}
                      <span>{size_kb > 1024 ? `${(size_kb/1024).toFixed(1)} MB` : `${size_kb} KB`}</span>
                      <span>&bull;</span>
                      <span className="text-status-success font-medium">{chunks} vectors</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-text-tertiary">
                    Last Updated: {upload_date}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  {!isSheet && !isImg ? (
                    <button
                      onClick={() => onSelectForAudit && onSelectForAudit(fname)}
                      className="flex-1 bg-surface-2 hover:bg-surface-3 border border-border text-text-primary text-xs py-1.5 rounded-lg font-medium transition-colors text-center flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-accent" />
                      <span>Audit in Viewer</span>
                    </button>
                  ) : (
                    <div className="flex-1 text-center py-1.5 text-[11px] text-zinc-400 font-mono bg-surface-2/60 rounded-lg border border-border">
                      {isSheet ? 'Tabular Semantic Index' : 'Spatial OCR Vectorized'}
                    </div>
                  )}
                  {url && (
                    <a
                      href={url}
                      download
                      className="p-1.5 bg-surface-2 hover:bg-surface-3 text-text-secondary rounded-lg transition-colors border border-border"
                      title="Download Source Document"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Web Scraper Progress & Terminal Modal */}
      {showScrapeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-text-primary font-bold text-sm">
                <Terminal className="w-4 h-4 text-teal" />
                <span>Automated Coal Portal Scraper & Spatial Ingestion Terminal</span>
              </div>
              <button
                onClick={() => setShowScrapeModal(false)}
                className="text-text-tertiary hover:text-text-primary text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-text-tertiary">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isScrapingActive ? 'bg-status-success animate-pulse' : 'bg-surface-3'}`} />
                <span>{isScrapingActive ? 'Scraping & Vector Ingestion in progress...' : 'Harness Idle / Ready'}</span>
              </div>
              <span className="text-[11px] text-text-tertiary">Auto-refreshing live logs</span>
            </div>

            {/* Terminal Window */}
            <div className="bg-surface-0 rounded-xl p-4 font-mono text-[11px] text-text-secondary h-80 overflow-y-auto space-y-1.5 border border-border">
              {scrapeLogs.length === 0 ? (
                <div className="text-text-tertiary italic">Connecting to scraper harness log stream...</div>
              ) : (
                scrapeLogs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-text-tertiary select-none">[{log.time}]</span>
                    <span className={
                      log.level === 'SUCCESS' ? 'text-status-success font-semibold' :
                      log.level === 'WARNING' ? 'text-status-warning' :
                      'text-text-secondary'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => {
                  setShowScrapeModal(false);
                  if (onRefresh) onRefresh();
                }}
                className="bg-surface-2 hover:bg-surface-3 text-text-primary px-4 py-2 rounded-xl text-xs font-semibold border border-border"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
