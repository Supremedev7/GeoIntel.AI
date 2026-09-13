import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FileText, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, 
  ChevronRight, Download, Eye, Layers, ShieldCheck, MapPin,
  Maximize2
} from 'lucide-react';

export default function PDFHighlightViewer({
  selectedFile,
  activeCitation = null,
  citations = [],
  onFileChange,
  onPageChange,
  availableFiles = []
}) {
  const [currentPage, setCurrentPage] = useState(activeCitation?.page_number ? Number(activeCitation.page_number) : 1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isFitWidth, setIsFitWidth] = useState(false);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay' or 'native'
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef(null);

  const rawSelected = typeof selectedFile === 'object' && selectedFile !== null ? selectedFile.filename : selectedFile;
  const firstAvailable = availableFiles.length > 0 ? (typeof availableFiles[0] === 'object' ? availableFiles[0].filename : availableFiles[0]) : '';
  const activeDoc = rawSelected || firstAvailable || 'Coal_Ministry_Mine_Plan_Guidelines.pdf';

  // Fetch document metadata to get accurate total pages and default dimensions
  useEffect(() => {
    let isMounted = true;
    if (!activeDoc) return;
    fetch(`/api/pdf-info?file=${encodeURIComponent(activeDoc)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (isMounted && info) {
          if (info.total_pages) setTotalPages(info.total_pages);
          if (info.width && info.height) {
            setPageSize({ width: info.width, height: info.height });
          }
        }
      })
      .catch((e) => console.warn("Failed to fetch pdf info:", e));
    return () => { isMounted = false; };
  }, [activeDoc]);

  // Synchronize incoming active citation jumps
  useEffect(() => {
    if (activeCitation && activeCitation.page_number) {
      const p = Number(activeCitation.page_number);
      if (p !== currentPage) {
        setCurrentPage(p);
      }
    }
  }, [activeCitation]);

  // Reset loading state on file or page change
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [activeDoc, currentPage]);

  const changePage = (newPage) => {
    const clamped = Math.max(1, Math.min(totalPages || 1, newPage));
    setCurrentPage(clamped);
    if (onPageChange) onPageChange(clamped);
  };

  // Dynamically resolve citation specifically for the currently viewed page
  const activeCitationForPage = useMemo(() => {
    // 1. If activeCitation matches current document and current page, use it
    if (activeCitation && Number(activeCitation.page_number) === Number(currentPage)) {
      const cDoc = (activeCitation.source || activeCitation.file_id || '').toLowerCase();
      const curDoc = (activeDoc || '').toLowerCase();
      const docMatches = cDoc === curDoc || cDoc.endsWith(curDoc) || curDoc.endsWith(cDoc);
      if (docMatches) {
        return activeCitation;
      }
    }

    // 2. Otherwise check if any citation in the citations array matches this document and this page
    if (citations && citations.length > 0) {
      const match = citations.find((c) => {
        const cDoc = (c?.source || c?.file_id || '').toLowerCase();
        const curDoc = (activeDoc || '').toLowerCase();
        const docMatches = cDoc === curDoc || cDoc.endsWith(curDoc) || curDoc.endsWith(cDoc);
        return docMatches && Number(c?.page_number) === Number(currentPage);
      });
      if (match) return match;
    }

    // 3. Current page has no citation! Clean state.
    return null;
  }, [activeCitation, citations, activeDoc, currentPage]);

  const currentBBox = activeCitationForPage?.bbox || null;
  const currentSnippet = activeCitationForPage?.exact_snippet || activeCitationForPage?.text || null;

  // Compute percentage styles for bounding box highlight
  const getHighlightStyle = () => {
    if (!currentBBox || !Array.isArray(currentBBox) || currentBBox.length < 4) return null;
    const [x0, y0, x1, y1] = currentBBox;
    const w = pageSize.width || 612;
    const h = pageSize.height || 792;

    const leftPct = Math.max(0, Math.min(100, (x0 / w) * 100));
    const topPct = Math.max(0, Math.min(100, (y0 / h) * 100));
    const widthPct = Math.max(2, Math.min(100 - leftPct, ((x1 - x0) / w) * 100));
    const heightPct = Math.max(1.5, Math.min(100 - topPct, ((y1 - y0) / h) * 100));

    return {
      left: `${leftPct}%`,
      top: `${topPct}%`,
      width: `${widthPct}%`,
      height: `${heightPct}%`,
    };
  };

  const highlightStyle = getHighlightStyle();

  return (
    <div id="tour-pdf-viewer" className="flex flex-col h-full bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-1 border-b border-border text-xs">
        <div className="flex items-center gap-2 min-w-0 max-w-[55%]">
          <div className="p-1.5 rounded-md bg-info/10 border border-info/20 text-info shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-text-primary text-xs truncate" title={activeDoc}>
              {activeDoc}
            </span>
            <span className="text-[10px] text-text-tertiary">
              Source Document &bull; {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
            </span>
          </div>
        </div>

        {/* Page & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => changePage(currentPage - 1)}
            className="p-1 rounded hover:bg-surface-2 text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={currentPage <= 1}
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-text-secondary font-mono px-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => changePage(currentPage + 1)}
            className="p-1 rounded hover:bg-surface-2 text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={currentPage >= totalPages}
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-surface-3 mx-1" />

          {/* Enhanced Zoom Controls */}
          <div className="flex items-center gap-0.5 bg-surface-2/60 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => {
                setIsFitWidth(false);
                setZoom((z) => Math.max(65, z - 15));
              }}
              disabled={zoom <= 65 && !isFitWidth}
              className="p-1 rounded hover:bg-surface-2 text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={() => {
                setIsFitWidth(false);
                setZoom(100);
              }}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                zoom === 100 && !isFitWidth ? 'text-accent font-bold bg-surface-0 shadow-xs' : 'text-text-tertiary hover:text-text-primary'
              }`}
              title="Reset to 100%"
            >
              {isFitWidth ? "Fit" : `${zoom}%`}
            </button>

            <button
              onClick={() => {
                setIsFitWidth(false);
                setZoom((z) => Math.min(150, z + 15));
              }}
              disabled={zoom >= 150 && !isFitWidth}
              className="p-1 rounded hover:bg-surface-2 text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="h-3.5 w-[1px] bg-surface-3 mx-0.5" />

            <button
              onClick={() => setIsFitWidth((prev) => !prev)}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isFitWidth 
                  ? 'bg-accent text-white shadow-xs' 
                  : 'text-text-tertiary hover:text-text-primary hover:bg-surface-2'
              }`}
              title={isFitWidth ? "Exit Fit to Width" : "Fit to Width"}
              aria-label="Fit to Width"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-surface-3 mx-1" />

          {/* Toggle view mode */}
          <div className="flex bg-surface-2 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('overlay')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                viewMode === 'overlay'
                  ? 'bg-surface-0 text-text-primary shadow-xs'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
              title="Spatial Overlay Viewer"
            >
              <Layers className="w-3 h-3" />
              <span>Spatial</span>
            </button>
            <button
              onClick={() => setViewMode('native')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                viewMode === 'native'
                  ? 'bg-surface-0 text-text-primary shadow-xs'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
              title="Native PDF Viewer"
            >
              <Eye className="w-3 h-3" />
              <span>PDF</span>
            </button>
          </div>

          <a
            href={`/api/pdf-raw/${activeDoc}`}
            download
            className="p-1.5 rounded hover:bg-surface-2 text-text-secondary ml-1"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Citation Location Sub-Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-surface-2/40 border-b border-border text-[11px] text-text-tertiary shrink-0">
        <div className="flex items-center gap-2 truncate">
          {currentBBox ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber shrink-0" />
              <span className="font-medium text-text-secondary truncate">
                Citation Location &bull; Page {currentPage} of {totalPages}
              </span>
            </>
          ) : (
            <span>Document View &bull; Page {currentPage} of {totalPages}</span>
          )}
        </div>
        <span className="text-[10px] text-text-tertiary font-mono shrink-0">
          {currentBBox ? "Highlighted Snippet" : "PDF Canvas"}
        </span>
      </div>

      {/* PDF Content Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4 bg-surface-0 relative w-full h-full text-center"
      >
        {viewMode === 'overlay' ? (
          <div 
            className="relative shadow-2xl transition-all duration-150 origin-top bg-white rounded inline-block text-left mx-auto"
            style={{ 
              width: isFitWidth ? '100%' : `${Math.round(760 * (zoom / 100))}px`,
              maxWidth: isFitWidth ? '100%' : 'none'
            }}
          >
            {imageLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-0/80 text-text-secondary text-xs gap-2 z-20 py-20">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span>Rendering PDF page view...</span>
              </div>
            )}

            <img
              src={`/api/pdf-page?file=${encodeURIComponent(activeDoc)}&page=${currentPage}`}
              alt={`Page ${currentPage} of ${activeDoc}`}
              className="w-full h-auto block select-none"
              onLoad={(e) => {
                setImageLoading(false);
              }}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />

            {/* Spatial Highlight Overlay Box */}
            {highlightStyle && !imageLoading && !imageError && (
              <div
                style={highlightStyle}
                className="absolute z-10 bg-amber/25 border-2 border-amber rounded-sm pointer-events-none transition-all duration-300 animate-pulse shadow-[0_0_12px_rgba(201,138,43,0.4)]"
              >
                <div className="absolute -top-5 left-0 bg-cmpdi-amber text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" /> Cited Source (Page {currentPage})
                </div>
              </div>
            )}

            {imageError && (
              <div className="p-8 text-center text-text-tertiary text-xs">
                Could not render page image. You can switch to Native PDF View above.
              </div>
            )}
          </div>
        ) : (
          <iframe
            src={`/api/pdf-raw/${activeDoc}#page=${currentPage}`}
            className="w-full h-full rounded border-0 bg-white"
            title="Native PDF View"
          />
        )}
      </div>

      {/* Footer Snippet Info Card */}
      {currentSnippet && (
        <div className="px-4 py-2 bg-surface-1 border-t border-border text-xs transition-all shrink-0">
          <div className="text-text-tertiary text-[10.5px] mb-0.5 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Cited Source Excerpt (Page {currentPage}):
          </div>
          <p className="text-text-secondary text-xs leading-relaxed line-clamp-2">
            "{currentSnippet}"
          </p>
        </div>
      )}
    </div>
  );
}
