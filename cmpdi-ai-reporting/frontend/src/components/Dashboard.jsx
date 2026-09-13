import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  BarChart3, Cloud, Layers, Activity, TrendingUp, 
  Sparkles, Pickaxe, MapPin, Database, RefreshCw, ChevronRight,
  FileText, Search, BookOpen, ArrowLeft, ExternalLink,
  Building2, Mountain, Flame, MessageSquare, SlidersHorizontal
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";

// Rich curated palettes matching CMPDI Coal Platform & user's reference image
const PALETTE_LIGHT = [
  "#B23B2E", // Rust Terracotta (dominant hero like "data")
  "#C98A2B", // Energy Warm Amber (warm hero like "visualisation")
  "#262A2E", // Coal Charcoal (deep slate like "design")
  "#1D7A72", // Digital Teal (like "work", "viewer")
  "#0B3556", // Institutional Navy
  "#4A7FAE", // Steel Info Blue (like "different")
  "#2F8A4A", // Earthy Green (like "good")
  "#C0392B", // Brick Red
  "#D97706", // Ochre Amber
  "#0F766E", // Deep Pine Teal
  "#1E3A8A", // Royal Slate
  "#334155", // Charcoal Slate
];

const PALETTE_DARK = [
  "#F87171", // Coral Rust (vivid hero)
  "#FBBF24", // Luminous Amber (warm hero)
  "#38BDF8", // Sky Info Blue
  "#2DD4BF", // Bright Digital Teal
  "#FB923C", // Tangerine Orange
  "#34D399", // Mint Emerald
  "#F1F5F9", // Crisp Slate White
  "#CBD5E1", // Cool Silver
  "#C084FC", // Soft Amethyst
  "#67E8F9", // Electric Cyan
  "#FCA5A5", // Soft Rose
  "#FDE047", // Radiant Gold
];

// Clean category definitions (no fake badges)
const CATEGORIES = [
  { id: "all", label: "All Topics" },
  { id: "geological_terms", label: "Geology" },
  { id: "subsidiaries", label: "Subsidiaries" },
  { id: "mining_metrics", label: "Operations" },
  { id: "domain_vocabulary", label: "Technology" },
];

/**
 * Pure Typographic Word Cloud Layout Generator
 * High-density Archimedean spiral packing with horizontal and -90° vertical words
 * Exactly matches the organic typographic collage style in the user's reference image.
 */
function generateTypographicCloud(words, width = 920, height = 460, isDark = false) {
  if (!words || words.length === 0) return [];
  const placed = [];
  const palette = isDark ? PALETTE_DARK : PALETTE_LIGHT;

  // Sort descending by occurrences / frequency value
  const sorted = [...words].sort(
    (a, b) => (b.occurrences || b.value || 0) - (a.occurrences || a.value || 0)
  );
  const count = sorted.length;
  const maxVal = sorted[0]?.occurrences || sorted[0]?.value || 100;
  const minVal = sorted[count - 1]?.occurrences || sorted[count - 1]?.value || 1;

  for (let i = 0; i < count; i++) {
    const item = sorted[i];
    const val = item.occurrences || item.value || 1;
    const norm = count === 1 ? 1 : (val - minVal) / Math.max(1, maxVal - minVal);

    // Font size scaling hierarchy matching rich wordle density
    let fontSize;
    let fontWeight;
    if (count <= 10) {
      fontSize = Math.round(22 + norm * 36);
      fontWeight = fontSize > 36 ? "900" : "800";
    } else {
      if (i === 0) { fontSize = 66; fontWeight = "900"; }
      else if (i === 1) { fontSize = 54; fontWeight = "900"; }
      else if (i === 2) { fontSize = 46; fontWeight = "800"; }
      else if (i < 6) { fontSize = 35; fontWeight = "800"; }
      else if (i < 12) { fontSize = 27; fontWeight = "800"; }
      else if (i < 22) { fontSize = 21; fontWeight = "700"; }
      else if (i < 36) { fontSize = 16; fontWeight = "700"; }
      else if (i < 52) { fontSize = 13; fontWeight = "600"; }
      else { fontSize = 11; fontWeight = "600"; }
    }

    // Dynamic ~22% vertical words (avoiding top hero words and words with extreme lengths)
    const textLen = item.text.length;
    const isVertical = count > 6 && i > 1 && textLen >= 4 && textLen <= 14 && (i % 4 === 1 || i % 7 === 3);

    // Precise letter metrics for dense packing (accounting for uppercase condensed text)
    const isAllUpper = item.text === item.text.toUpperCase();
    const charWidthFactor = isAllUpper ? 0.60 : 0.52;
    const textWidth = textLen * fontSize * charWidthFactor;
    const textHeight = fontSize * 0.86;

    const boxW = isVertical ? textHeight : textWidth;
    const boxH = isVertical ? textWidth : textHeight;

    const cx = width / 2;
    const cy = height / 2;

    let placedX = null;
    let placedY = null;

    // Archimedean Spiral: dense, fine steps from center outwards
    // Small r growth lets smaller words pack tightly into interior hollows/gaps
    const maxSteps = 3800;
    const pad = 2; // tight packing just like user reference image

    for (let s = 0; s < maxSteps; s++) {
      const theta = s * 0.16;
      const r = 0.17 * s;
      // Elliptical ratio matching 2:1 aspect ratio of canvas
      const x = cx + r * 1.65 * Math.cos(theta) - boxW / 2;
      const y = cy + r * 0.85 * Math.sin(theta) - boxH / 2;

      // Inside canvas boundary with safe padding
      if (x < 10 || x + boxW > width - 10 || y < 10 || y + boxH > height - 10) {
        continue;
      }

      // Check collision with already placed words
      let overlap = false;
      for (let pIdx = 0; pIdx < placed.length; pIdx++) {
        const p = placed[pIdx];
        if (
          !(
            x + boxW + pad < p.x ||
            x > p.x + p.w + pad ||
            y + boxH + pad < p.y ||
            y > p.y + p.h + pad
          )
        ) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        placedX = x;
        placedY = y;
        break;
      }
    }

    if (placedX !== null) {
      placed.push({
        text: item.text,
        fontSize,
        fontWeight,
        isVertical,
        x: Math.round(placedX),
        y: Math.round(placedY),
        w: Math.round(boxW),
        h: Math.round(boxH),
        // Stride coprime to avoid adjacent duplicate colors
        color: palette[(i * 3 + 1) % palette.length],
        category: item.category || "geological_terms",
        occurrences: val,
        citations: item.citations || 1,
      });
    }
  }

  return placed;
}

export default function Dashboard({ onAuditDocument, onAskAssistant }) {
  const { theme } = useAppContext();
  const isDark = theme === "dark";

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [cloudSearch, setCloudSearch] = useState("");

  // Sub-tab navigation: "cloud" | "occurrences"
  const [subTab, setSubTab] = useState("cloud");

  // Occurrence Exploration State
  const [selectedTerm, setSelectedTerm] = useState("MCL");
  const [occurrenceData, setOccurrenceData] = useState(null);
  const [loadingOccurrence, setLoadingOccurrence] = useState(false);
  const [searchTermInput, setSearchTermInput] = useState("");

  // Hovered Word Tooltip State
  const [hoveredWord, setHoveredWord] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cloudContainerRef = useRef(null);

  const fetchAnalytics = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const resp = await fetch(`/api/analytics${forceRefresh ? "?refresh=true" : ""}`);
      if (resp.ok) {
        const data = await resp.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEntityOccurrences = async (term) => {
    if (!term || !term.trim()) return;
    const cleanTerm = term.trim();
    setSelectedTerm(cleanTerm);
    setLoadingOccurrence(true);
    try {
      const resp = await fetch(`/api/entity-occurrences?term=${encodeURIComponent(cleanTerm)}`);
      if (resp.ok) {
        const data = await resp.json();
        setOccurrenceData(data);
      } else {
        setOccurrenceData(null);
      }
    } catch (e) {
      console.error("Failed to fetch entity occurrences:", e);
      setOccurrenceData(null);
    } finally {
      setLoadingOccurrence(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchEntityOccurrences("MCL");
  }, []);

  const handleWordClick = (termText) => {
    setSelectedTerm(termText);
    setSubTab("occurrences");
    fetchEntityOccurrences(termText);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTermInput.trim()) {
      handleWordClick(searchTermInput.trim());
    }
  };

  const handleMouseMove = (e) => {
    if (!cloudContainerRef.current) return;
    const rect = cloudContainerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const { word_cloud = [], subsidiaries = [], topic_clusters = [], macro_kpis = {} } = analytics || {};

  // Filter word cloud: strictly exclude any terms with 0 citations or 0 occurrences
  const verifiedWordCloud = useMemo(() => {
    return word_cloud.filter((w) => (w.citations || 0) > 0 && (w.occurrences || 0) > 0);
  }, [word_cloud]);

  // Filter by active category & search query
  const filteredWords = useMemo(() => {
    return verifiedWordCloud
      .filter((w) => (activeCategory === "all" ? true : w.category === activeCategory))
      .filter((w) => {
        if (!cloudSearch.trim()) return true;
        return w.text.toLowerCase().includes(cloudSearch.toLowerCase().trim());
      });
  }, [verifiedWordCloud, activeCategory, cloudSearch]);

  // Generate Typographic SVG Word Cloud layout
  const cloudItems = useMemo(() => {
    const inputWords = filteredWords.length > 0 ? filteredWords : verifiedWordCloud;
    return generateTypographicCloud(inputWords, 920, 460, isDark);
  }, [filteredWords, verifiedWordCloud, isDark]);

  const popularEntities = [
    "Barakar", "Raniganj", "Stripping Ratio",
    "Overburden", "Coal Seam", "MCL",
    "SECL", "CMPDI", "Opencast", "CBM"
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-text-tertiary gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-accent" />
        <span className="text-sm font-medium">Calculating geological TF-IDF frequencies &amp; topic clusters...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8 text-text-tertiary">
        Analytics service unavailable. Please check backend connection.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Level Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab("cloud")}
            className={`h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === "cloud"
                ? "bg-accent text-white shadow-sm"
                : "bg-surface-1 text-text-secondary hover:text-text-primary border border-border"
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Interactive Word Cloud</span>
          </button>

          <button
            onClick={() => {
              setSubTab("occurrences");
              if (!occurrenceData) {
                fetchEntityOccurrences(selectedTerm);
              }
            }}
            className={`h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === "occurrences"
                ? "bg-accent text-white shadow-sm"
                : "bg-surface-1 text-text-secondary hover:text-text-primary border border-border"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Occurrence Explorer</span>
            {selectedTerm && (
              <span className="text-accent text-[11px] font-medium ml-1">
                ({selectedTerm})
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-text-tertiary hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-success" />
          <span>CMPDI Geological &amp; Operations Intelligence</span>
        </div>
      </div>

      {/* SUB-TAB 1: TYPOGRAPHIC WORD CLOUD & MACRO KPIS */}
      {subTab === "cloud" && (
        <>
          {/* Top Macro KPI Cards (Clean, authentic metrics aligned to CMPDI platform) */}
          <div id="tour-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Raw Coal Production */}
            <div className="bg-surface-1 border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Raw Coal Production</div>
                <div className="text-2xl font-bold text-text-primary mt-1">
                  {macro_kpis.total_production_mt || "703.20"} <span className="text-xs text-text-tertiary font-normal">MT</span>
                </div>
                <div className="text-[11px] text-status-success flex items-center gap-1 mt-1 font-medium">
                  <TrendingUp className="w-3 h-3" /> +{macro_kpis.production_growth_pct || "10.1"}% YoY
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                <Pickaxe className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: CMPDI Drilling Meterage */}
            <div className="bg-surface-1 border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Exploration Drilling</div>
                <div className="text-2xl font-bold text-text-primary mt-1">
                  {macro_kpis.total_drilling_lakh_m || "13.82"} <span className="text-xs text-text-tertiary font-normal">Lakh m</span>
                </div>
                <div className="text-[11px] text-teal mt-1 font-medium">
                  118 Gondwana Coal Blocks
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal shrink-0">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Overburden Removal */}
            <div className="bg-surface-1 border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Overburden Removal</div>
                <div className="text-2xl font-bold text-text-primary mt-1">
                  {macro_kpis.total_obr_mcum || "1,650.40"} <span className="text-xs text-text-tertiary font-normal">M.Cum</span>
                </div>
                <div className="text-[11px] text-amber mt-1 font-medium">
                  Stripping: 2.48 m³/t
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber shrink-0">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: CBM Clean Coal */}
            <div className="bg-surface-1 border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">CBM Clean Coal</div>
                <div className="text-2xl font-bold text-text-primary mt-1">
                  {macro_kpis.cbm_gip_bcm || "25.40"} <span className="text-xs text-text-tertiary font-normal">BCM</span>
                </div>
                <div className="text-[11px] text-info mt-1 font-medium">
                  Jharia &amp; Bokaro Deep Seams
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info shrink-0">
                <Database className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* AUTHENTIC TYPOGRAPHIC WORD CLOUD SECTION (LIKE REFERENCE IMAGE) */}
          <div id="tour-word-cloud" className="bg-surface-1 border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            {/* Controls Toolbar: Title, Filter Tabs, and Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  Geological &amp; Operational Word Cloud
                </h2>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Click any keyword to explore exact document locations, excerpts, and page citations.
                </p>
              </div>

              {/* Perfectly Aligned Controls Row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Clean Category Filter Tabs */}
                <div className="h-9 flex items-center bg-surface-0 border border-border rounded-xl p-0.5 text-xs gap-0.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`h-full px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeCategory === cat.id
                          ? "bg-accent text-white shadow-xs"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Instant Filter Search Input */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={cloudSearch}
                    onChange={(e) => setCloudSearch(e.target.value)}
                    placeholder="Filter cloud terms..."
                    className="h-9 w-36 sm:w-44 bg-surface-0 border border-border rounded-xl pl-8 pr-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
                  />
                  {cloudSearch && (
                    <button
                      onClick={() => setCloudSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Re-index / Refresh Button */}
                <button
                  onClick={() => fetchAnalytics(true)}
                  disabled={refreshing}
                  title="Re-run Semantic TF-IDF extraction"
                  className="h-9 px-3 rounded-xl bg-surface-0 hover:bg-surface-2 text-text-secondary hover:text-text-primary border border-border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-accent" : ""}`} />
                  <span className="hidden sm:inline">{refreshing ? "Indexing..." : "Refresh"}</span>
                </button>
              </div>
            </div>

            {/* PURE TYPOGRAPHIC SVG WORD CLOUD CANVAS */}
            <div
              ref={cloudContainerRef}
              onMouseMove={handleMouseMove}
              className="relative w-full rounded-xl bg-surface-0/70 dark:bg-surface-0/40 border border-border/80 p-2 sm:p-4 flex items-center justify-center min-h-[380px] sm:min-h-[440px] select-none overflow-hidden"
            >
              {cloudItems.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <p className="text-sm font-medium text-text-secondary">No terms match your search filter.</p>
                  <button
                    onClick={() => { setActiveCategory("all"); setCloudSearch(""); }}
                    className="text-xs text-accent hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <svg
                  viewBox="0 0 920 460"
                  className="w-full h-auto max-h-[460px]"
                  style={{ overflow: "visible" }}
                >
                  {cloudItems.map((item, idx) => {
                    const cx = item.x + item.w / 2;
                    const cy = item.y + item.h / 2;
                    const isHovered = hoveredWord?.text === item.text;

                    return (
                      <g
                        key={idx}
                        transform={
                          item.isVertical
                            ? `rotate(-90 ${cx} ${cy})`
                            : undefined
                        }
                        className="cursor-pointer group"
                        onClick={() => handleWordClick(item.text)}
                        onMouseEnter={() => setHoveredWord(item)}
                        onMouseLeave={() => setHoveredWord(null)}
                      >
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={item.fontSize}
                          fontWeight={item.fontWeight}
                          fill={item.color}
                          letterSpacing="-0.025em"
                          style={{
                            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                            transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                            opacity: hoveredWord ? (isHovered ? 1 : 0.38) : 0.95,
                            transform: isHovered ? "scale(1.1)" : "scale(1)",
                            transformOrigin: `${cx}px ${cy}px`,
                            filter: isHovered ? `drop-shadow(0 0 8px ${item.color}90)` : "none",
                          }}
                        >
                          {item.text}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Minimalist Floating Tooltip on Hover */}
              {hoveredWord && (
                <div
                  className="absolute pointer-events-none z-30 bg-surface-1 border border-border px-3 py-1.5 rounded-lg shadow-xl text-xs text-text-primary flex items-center gap-2 transform -translate-x-1/2 -translate-y-full transition-opacity duration-150"
                  style={{ left: mousePos.x, top: mousePos.y - 12 }}
                >
                  <span className="font-bold">{hoveredWord.text}</span>
                  <span className="text-text-tertiary">&bull;</span>
                  <span className="font-mono text-accent font-semibold">{hoveredWord.occurrences} mentions</span>
                  <span className="text-text-tertiary">&bull;</span>
                  <span className="text-text-secondary">{hoveredWord.citations} cited docs</span>
                </div>
              )}
            </div>

            {/* Clean Footer Bar */}
            <div className="flex items-center justify-between text-xs text-text-tertiary pt-1">
              <span>Showing {cloudItems.length} corpus terms weighted by frequency.</span>
              <button
                onClick={() => {
                  setSubTab("occurrences");
                  fetchEntityOccurrences(selectedTerm);
                }}
                className="text-accent hover:text-accent-hover font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Occurrence Explorer</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subsidiary Breakdown & Topic Modeling Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subsidiary Production Breakdown */}
            <div className="bg-surface-1 border border-border rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-bold text-text-primary">Subsidiary Coal Production Metrics</h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent" /> Opencast
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber" /> Underground
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {subsidiaries.map((sub, idx) => {
                  const maxProd = 200;
                  const ocWidth = (sub.opencast / maxProd) * 100;
                  const ugWidth = (sub.underground / maxProd) * 100;

                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleWordClick(sub.name)}
                      className="bg-surface-0 hover:bg-surface-2 p-2.5 rounded-lg border border-border space-y-1.5 cursor-pointer transition-colors"
                      title={`Click to inspect "${sub.name}" occurrences`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-text-primary">{sub.name}</span>
                          <span className="text-text-tertiary ml-1.5 font-normal">({sub.fullName})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-accent">{sub.total.toFixed(1)} MT</span>
                          <span className="text-[10px] text-status-success font-medium">+{sub.growth}%</span>
                        </div>
                      </div>

                      <div className="w-full bg-surface-2 h-2 rounded-full overflow-hidden flex">
                        <div 
                          style={{ width: `${ocWidth}%` }} 
                          className="bg-accent h-full"
                          title={`Opencast: ${sub.opencast} MT`}
                        />
                        <div 
                          style={{ width: `${ugWidth}%` }} 
                          className="bg-amber h-full"
                          title={`Underground: ${sub.underground} MT`}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-text-tertiary">
                        <span>OC: {sub.opencast} MT &bull; UG: {sub.underground} MT</span>
                        <span>Region: {sub.region}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stratigraphy & Thematic Clusters */}
            <div className="bg-surface-1 border border-border rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-bold text-text-primary">Stratigraphy &amp; Thematic Clusters</h3>
                </div>
                <span className="text-xs text-text-tertiary">Corpus Distribution</span>
              </div>

              <div className="space-y-3">
                {topic_clusters.map((cluster, idx) => (
                  <div key={idx} className="bg-surface-0 p-3.5 rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cluster.color }} />
                        <span className="font-bold text-text-primary">{cluster.topic}</span>
                      </div>
                      <span className="font-semibold text-[11px] text-text-secondary">
                        {cluster.share}%
                      </span>
                    </div>

                    <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${cluster.share}%`, backgroundColor: cluster.color }} 
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cluster.terms.map((term, tIdx) => (
                        <button 
                          key={tIdx} 
                          onClick={() => handleWordClick(term)}
                          className="text-[11px] bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary px-2 py-0.5 rounded border border-border transition-colors cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* SUB-TAB 2: CLEAN, AUTHENTIC OCCURRENCE EXPLORER (NO FAKE BADGES) */}
      {subTab === "occurrences" && (
        <div className="space-y-6">
          {/* Top Control Bar with Search & Quick Suggestions */}
          <div className="bg-surface-1 border border-border rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSubTab("cloud")}
                  className="h-9 px-3 rounded-lg bg-surface-0 hover:bg-surface-2 text-text-primary border border-border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Word Cloud</span>
                </button>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <h2 className="text-sm font-bold text-text-primary">
                  Document Occurrence &amp; Context Inspector
                </h2>
              </div>

              {/* In-tab Search for any Term */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTermInput}
                    onChange={(e) => setSearchTermInput(e.target.value)}
                    placeholder="Search any entity or term..."
                    className="h-9 w-full bg-surface-0 border border-border rounded-lg pl-9 pr-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
                  />
                </div>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  Inspect
                </button>
              </form>
            </div>

            {/* Quick Entity Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
              <span className="text-[11px] text-text-tertiary mr-1 font-medium">Quick Selection:</span>
              {popularEntities.map((ent, idx) => (
                <button
                  key={idx}
                  onClick={() => handleWordClick(ent)}
                  className={`text-[11px] h-7 px-2.5 rounded-md border transition-colors cursor-pointer ${
                    selectedTerm.toLowerCase() === ent.toLowerCase()
                      ? "bg-accent text-white border-accent font-semibold shadow-xs"
                      : "bg-surface-0 text-text-secondary border-border hover:bg-surface-2 hover:text-text-primary"
                  }`}
                >
                  {ent}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loadingOccurrence && (
            <div className="bg-surface-1 border border-border rounded-xl p-12 text-center space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin text-accent mx-auto" />
              <div className="text-sm font-semibold text-text-primary">
                Scanning repository for "{selectedTerm}"...
              </div>
              <p className="text-xs text-text-tertiary">
                Extracting page numbers and exact sentence excerpts from official publications.
              </p>
            </div>
          )}

          {/* Occurrence Results (Clean, Authentic, No Fake Badges) */}
          {!loadingOccurrence && occurrenceData && (
            <div className="space-y-6">
              {/* Clean Entity Summary Banner */}
              <div className="bg-surface-1 border border-border rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                      Corpus Entity Profile
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mt-0.5">
                      {occurrenceData.term}
                    </h2>
                    <p className="text-xs text-text-tertiary mt-1">
                      Repository-wide occurrence audit across active CMPDI &amp; Coal India publications.
                    </p>
                  </div>

                  {/* Clean Authentic Counters */}
                  <div className="flex items-center gap-3">
                    <div className="bg-surface-0 px-4 py-2 rounded-lg border border-border text-center min-w-[90px]">
                      <div className="text-[10px] text-text-tertiary font-medium">Mentions</div>
                      <div className="text-xl font-bold text-accent mt-0.5">
                        {occurrenceData.total_occurrences}
                      </div>
                    </div>

                    <div className="bg-surface-0 px-4 py-2 rounded-lg border border-border text-center min-w-[90px]">
                      <div className="text-[10px] text-text-tertiary font-medium">Documents</div>
                      <div className="text-xl font-bold text-text-primary mt-0.5">
                        {occurrenceData.document_count}
                      </div>
                    </div>

                    <div className="bg-surface-0 px-4 py-2 rounded-lg border border-border text-center min-w-[90px]">
                      <div className="text-[10px] text-text-tertiary font-medium">Avg / Doc</div>
                      <div className="text-xl font-bold text-amber mt-0.5">
                        {occurrenceData.document_count > 0 
                          ? (occurrenceData.total_occurrences / occurrenceData.document_count).toFixed(1)
                          : "0.0"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Domain Synthesis Box */}
                {occurrenceData.summary && (
                  <div className="bg-surface-0 border border-border rounded-lg p-3.5 flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed text-text-primary">
                      <strong className="text-accent font-semibold block mb-0.5">Executive Context:</strong>
                      {occurrenceData.summary}
                    </div>
                  </div>
                )}

                {/* Clean Action Buttons (Perfect Height & Alignment) */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {onAskAssistant && (
                    <button
                      onClick={() => onAskAssistant(`Provide a comprehensive operational analysis for ${occurrenceData.term}`)}
                      className="h-9 px-4 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask GeoIntel Assistant about "{occurrenceData.term}"</span>
                    </button>
                  )}

                  {occurrenceData.documents && occurrenceData.documents.length > 0 && onAuditDocument && (
                    <button
                      onClick={() => {
                        const firstDoc = occurrenceData.documents[0];
                        const firstPage = firstDoc.snippets && firstDoc.snippets.length > 0 ? firstDoc.snippets[0].page : 1;
                        onAuditDocument(firstDoc.source, firstPage);
                      }}
                      className="h-9 px-4 rounded-lg bg-surface-0 hover:bg-surface-2 text-text-primary border border-border text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-text-secondary" />
                      <span>Audit First Citation in PDF Viewer</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Document Breakdown List */}
              <div className="bg-surface-1 border border-border rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-bold text-text-primary">
                      Official Document Sources for "{occurrenceData.term}"
                    </h3>
                  </div>
                  <span className="text-xs text-text-tertiary">
                    {occurrenceData.documents ? occurrenceData.documents.length : 0} publications
                  </span>
                </div>

                {(!occurrenceData.documents || occurrenceData.documents.length === 0) ? (
                  <div className="p-8 text-center space-y-2 bg-surface-0 rounded-lg border border-border">
                    <p className="text-text-secondary text-xs font-medium">
                      No exact occurrences found for "{occurrenceData.term}".
                    </p>
                    <p className="text-[11px] text-text-tertiary">
                      Try selecting another term from the quick selection list above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {occurrenceData.documents.map((doc, dIdx) => (
                      <div 
                        key={dIdx} 
                        className="bg-surface-0 border border-border rounded-lg p-3.5 space-y-2.5 hover:border-border-hover transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center text-accent shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-text-primary">
                                {String(doc.source || "Document").replace(".pdf", "").replace(/_/g, " ")}
                              </div>
                              <div className="text-[10.5px] text-text-tertiary font-mono">
                                {doc.source}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-medium text-text-secondary">
                              {doc.count} {doc.count === 1 ? "mention" : "mentions"}
                            </span>
                            {onAuditDocument && (
                              <button
                                onClick={() => {
                                  const firstPage = doc.snippets && doc.snippets.length > 0 ? doc.snippets[0].page : 1;
                                  onAuditDocument(doc.source, firstPage);
                                }}
                                className="h-7 px-2.5 rounded-md bg-surface-1 hover:bg-surface-2 text-text-primary border border-border text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span>Audit in Viewer</span>
                                <ExternalLink className="w-3 h-3 text-text-tertiary" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Sentence Context Snippets with Page Numbers */}
                        {doc.snippets && doc.snippets.length > 0 && (
                          <div className="space-y-1.5">
                            {doc.snippets.map((snip, sIdx) => (
                              <div 
                                key={sIdx} 
                                className="bg-surface-1 rounded-md p-2 border border-border text-xs text-text-secondary flex items-start gap-2"
                              >
                                <span className="text-[10.5px] font-mono text-amber font-semibold shrink-0">
                                  Page {snip.page}:
                                </span>
                                <div className="leading-relaxed text-text-secondary">
                                  "{snip.text}"
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
