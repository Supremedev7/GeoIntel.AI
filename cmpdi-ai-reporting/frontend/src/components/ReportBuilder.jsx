import React, { useState } from "react";
import { 
  FileCheck, Download, Sparkles, FileText, CheckCircle2, 
  Layers, ArrowRight, RefreshCw, FileCode, Shield, Sliders,
  Calendar, Building2, Eye, Code, FileSpreadsheet,
  Activity, Database, Pickaxe, Zap, Compass
} from "lucide-react";

function renderMarkdownBlocks(markdownText) {
  if (!markdownText) return null;
  const lines = markdownText.split("\n");
  const blocks = [];
  let tableBuffer = [];

  const flushTable = (key) => {
    if (tableBuffer.length === 0) return;
    const headerRow = tableBuffer[0];
    const dataRows = tableBuffer.slice(1).filter(row => !row.every(cell => cell.match(/^:?-+:?$/)));
    blocks.push(
      <div key={`tbl-${key}`} className="overflow-x-auto my-3 rounded-xl border border-border shadow-sm">
        <table className="w-full text-left text-xs border-collapse bg-surface-0">
          <thead>
            <tr className="bg-surface-1 border-b border-border">
              {headerRow.map((h, i) => (
                <th key={i} className="px-3.5 py-2 font-semibold text-accent text-[11px] uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dataRows.map((r, rIdx) => (
              <tr key={rIdx} className="hover:bg-surface-2 transition-colors odd:bg-surface-0 even:bg-surface-1/50">
                {r.map((c, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 text-text-primary text-[11px]">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
  };

  const auditSection = [];
  let inAudit = false;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed === "### Factual Audit Summary") {
      inAudit = true;
      auditSection.push(
        <div key={`audit-${idx}`} className="bg-success/10 border border-success/30 rounded-xl p-4 my-4">
          <h3 className="text-success font-bold mb-2 flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4"/> Factual Audit Summary
          </h3>
        </div>
      );
      return;
    }

    if (inAudit && trimmed.startsWith("## ")) {
      inAudit = false;
    }

    if (inAudit) {
      if (trimmed.startsWith("- ")) {
        const lastEl = auditSection[auditSection.length - 1];
        const newChild = <p key={idx} className="text-text-primary text-[11px] py-0.5 ml-2">• {trimmed.substring(2)}</p>;
        auditSection[auditSection.length - 1] = React.cloneElement(lastEl, {
          children: [...React.Children.toArray(lastEl.props.children), newChild]
        });
        return;
      }
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed.split("|").slice(1, -1).map(c => c.trim().replace(/\*\*/g, ''));
      tableBuffer.push(cells);
      return;
    }

    if (tableBuffer.length > 0) {
      flushTable(idx);
    }

    if (!trimmed) {
      blocks.push(<div key={`sp-${idx}`} className="h-1" />);
    } else if (trimmed.startsWith("# ")) {
      blocks.push(<h1 key={`h1-${idx}`} className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-2">{trimmed.replace("# ", "")}</h1>);
    } else if (trimmed.startsWith("## ")) {
      blocks.push(<h2 key={`h2-${idx}`} className="text-sm font-bold text-accent mt-5 mb-1.5 border-b border-border pb-1 flex items-center gap-1.5">{trimmed.replace("## ", "")}</h2>);
    } else if (trimmed.startsWith("### ")) {
      blocks.push(<h3 key={`h3-${idx}`} className="text-xs font-semibold text-amber mt-3 mb-1">{trimmed.replace("### ", "")}</h3>);
    } else if (trimmed.startsWith("> ")) {
      blocks.push(<blockquote key={`bq-${idx}`} className="border-l-2 border-amber pl-3 py-1.5 italic bg-amber/10 text-text-primary rounded-r my-2 text-[11.5px]">{trimmed.replace("> ", "")}</blockquote>);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      blocks.push(<li key={`li-${idx}`} className="ml-4 list-disc text-text-secondary my-0.5 text-[11.5px]">{trimmed.substring(2)}</li>);
    } else if (trimmed.startsWith("---")) {
      blocks.push(<hr key={`hr-${idx}`} className="border-border my-3" />);
    } else {
      blocks.push(<p key={`p-${idx}`} className="my-1 text-text-primary text-[11.5px] leading-relaxed">{trimmed}</p>);
    }
  });

  if (tableBuffer.length > 0) {
    flushTable("last");
  }

  if (auditSection.length > 0) {
     blocks.unshift(...auditSection);
  }

  return blocks;
}

export default function ReportBuilder({ apiKey, availableFiles = [] }) {
  // Configuration State
  const [reportType, setReportType] = useState("comprehensive_audit");
  const [subsidiary, setSubsidiary] = useState("All CIL Aggregate");
  const [timeframe, setTimeframe] = useState("FY 2023-24");
  const [tone, setTone] = useState("Formal Executive Brief");
  const [customPrompt, setCustomPrompt] = useState("");

  const [generating, setGenerating] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [previewTab, setPreviewTab] = useState("rendered"); // "rendered" or "raw"
  const [error, setError] = useState(null);

  const reportArchetypes = [
    {
      id: "comprehensive_audit",
      title: "Executive Subsidiary Performance",
      category: "Macro Operations",
      icon: Building2,
      description: "National & subsidiary production volumes, targets, YoY growth rates, rail rake logistics, and First Mile Connectivity."
    },
    {
      id: "production_obr",
      title: "OBR & Stripping Ratio Optimization",
      category: "Mining Operations",
      icon: Layers,
      description: "Overburden cubic meterage, bench advance dynamics, stripping ratio variances (1.18 to 4.21 m³/t), and HEMM machinery."
    },
    {
      id: "geological_exploration",
      title: "Stratigraphy & Borehole Drilling",
      category: "CMPDI Exploration",
      icon: Compass,
      description: "Lower Gondwana Barakar & Raniganj formations, CMPDI RI-I to RI-VII drilling meterage (13.82 Lakh m), and 2D/3D seismic profiling."
    },
    {
      id: "cbm_clean_coal",
      title: "CBM Gas & Coal Beneficiation",
      category: "Energy & Beneficiation",
      icon: Database,
      description: "Coal Bed Methane reserves (25.40 BCM) in Jharia/Bokaro deep seams, coal washery yields, and Gross Calorific Value (GCV) bands."
    },
    {
      id: "custom_inquiry",
      title: "Custom Investigative Audit",
      category: "Targeted Directives",
      icon: Sparkles,
      description: "Deep-dive inquiry based on your custom engineering directives, environmental compliance standards, or mine safety parameters."
    }
  ];

  const subsidiariesList = [
    { id: "All CIL Aggregate", name: "All CIL Aggregate (National Totals)" },
    { id: "MCL", name: "Mahanadi Coalfields Ltd (MCL) - Odisha" },
    { id: "SECL", name: "South Eastern Coalfields (SECL) - Bilaspur" },
    { id: "NCL", name: "Northern Coalfields (NCL) - Singrauli" },
    { id: "CCL", name: "Central Coalfields (CCL) - Ranchi" },
    { id: "WCL", name: "Western Coalfields (WCL) - Nagpur" },
    { id: "BCCL", name: "Bharat Coking Coal (BCCL) - Dhanbad" },
    { id: "ECL", name: "Eastern Coalfields (ECL) - Sanctoria" },
    { id: "CMPDI", name: "CMPDI Headquarters & Regional Institutes" }
  ];

  const timeframesList = [
    "FY 2023-24",
    "FY 2024-25",
    "Q1 (April - June)",
    "Q2 (July - September)",
    "Q3 (October - December)",
    "Q4 (January - March)"
  ];

  const tonesList = [
    { id: "Formal Executive Brief", label: "Formal Executive Brief", desc: "Concise, high-level summaries for Board & Ministry review" },
    { id: "Technical Geological Audit", label: "Technical Geological Audit", desc: "In-depth stratigraphic data, drilling logs, precision metrics" },
    { id: "Public Release", label: "Public Release & Dissemination", desc: "Clear, transparent communication for public & investor portals" }
  ];

  const logFeedback = async (feedbackType) => {
    try {
      await fetch("/api/report-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_name: reportResult.base_name,
          feedback: feedbackType
        }),
      });
      alert("Feedback logged. Thank you!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const resp = await fetch("/api/generate-structured-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: reportType,
          subsidiary,
          timeframe,
          tone,
          custom_prompt: customPrompt,
          api_key: apiKey || undefined
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `Report synthesis failed with status ${resp.status}`);
      }

      const data = await resp.json();
      setReportResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-surface-1 border border-border rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-info/10 text-info text-xs font-medium mb-2 border border-info/25">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Technical Documentation Studio
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              CMPDI Multi-Format Autonomous Report Generator
            </h1>
            <p className="text-xs text-text-secondary mt-1 max-w-2xl">
              Select an objective archetype, target subsidiary, and time horizon. The engine performs targeted vector searches across 100+ documents and synthesizes executive Word (<strong className="text-info">.docx</strong>), print PDF (<strong className="text-amber">.pdf</strong>), and Markdown (<strong className="text-text-primary">.md</strong>) reports with full citations.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-accent hover:bg-accent-hover text-white font-semibold px-6 py-3 rounded-xl shadow-md shadow-accent/25 flex items-center gap-2 disabled:opacity-50 transition-all text-sm shrink-0"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Report...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Generate Official Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-status-error/10 border border-status-error/30 text-status-error p-4 rounded-xl text-xs flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Split Pane: Left Config Studio & Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Intuitive Archetype & Parameters Controls (5 cols) */}
        <div id="tour-report-options" className="lg:col-span-5 space-y-5 bg-surface-1 border border-border rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                1. Select Report Focus
              </h2>
            </div>
          </div>

          {/* Archetype Selector Cards */}
          <div className="space-y-2">
            {reportArchetypes.map((arch) => {
              const isSelected = reportType === arch.id;
              const ArchIcon = arch.icon;
              return (
                <div
                  key={arch.id}
                  onClick={() => setReportType(arch.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-accent/10 border-accent text-text-primary shadow-xs"
                      : "bg-surface-0 border-border hover:border-border-hover hover:bg-surface-2 text-text-secondary"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected 
                        ? "bg-accent/20 text-accent" 
                        : "bg-surface-2 text-text-tertiary"
                    }`}>
                      <ArchIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold ${isSelected ? "text-text-primary" : "text-text-secondary"}`}>
                          {arch.title}
                        </span>
                        <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">
                          {arch.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-tertiary mt-0.5 leading-snug line-clamp-2">
                        {arch.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Parameters Section */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-accent" />
              2. Scope &amp; Horizon
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Target Subsidiary */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary">
                  Target Subsidiary:
                </label>
                <select
                  value={subsidiary}
                  onChange={(e) => setSubsidiary(e.target.value)}
                  className="w-full bg-surface-0 border border-border rounded-xl px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                >
                  {subsidiariesList.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Period */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-secondary">
                  Reporting Period:
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full bg-surface-0 border border-border rounded-xl px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                >
                  {timeframesList.map((tf) => (
                    <option key={tf} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tone */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-secondary">
                Analytical Tone:
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-surface-0 border border-border rounded-xl px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
              >
                {tonesList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} - {t.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Directives */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-secondary flex items-center justify-between">
                <span>Specific Directives / Focus (Optional):</span>
                <span className="text-[10px] text-text-tertiary">Searched across docs</span>
              </label>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Focus on deep seam permeability, Talcher expansion, or DGMS safety benchmarks..."
                className="w-full bg-surface-0 border border-border rounded-xl p-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Split-Pane Live Interactive Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-xl min-h-[550px]">
          {/* Preview Header & Export Action Buttons */}
          <div className="px-5 py-3.5 bg-surface-1 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Live Interactive Preview
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-surface-0 p-0.5 rounded-lg border border-border text-[11px]">
              <button
                onClick={() => setPreviewTab("rendered")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  previewTab === "rendered" ? "bg-accent text-white font-medium shadow-xs" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                Rendered Report
              </button>
              <button
                onClick={() => setPreviewTab("pdf")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  previewTab === "pdf" ? "bg-accent text-white font-medium shadow-xs" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                Official PDF
              </button>
              <button
                onClick={() => setPreviewTab("raw")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  previewTab === "raw" ? "bg-accent text-white font-medium shadow-xs" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                Raw Markdown
              </button>
            </div>
          </div>

          {/* Export Actions Bar if Report Generated */}
          {reportResult && (
            <div className="px-5 py-2.5 bg-surface-2 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-status-success font-semibold text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <span>Ready: {reportResult.base_name}</span>
              </div>

              {/* Feedback and Download Actions */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-tertiary italic">Was this report useful?</span>
                  <button onClick={() => logFeedback("useful")} className="hover:scale-110 transition text-sm" title="Useful">👍</button>
                  <button onClick={() => logFeedback("not_useful")} className="hover:scale-110 transition text-sm" title="Not Useful">👎</button>
                </div>

                <div className="flex items-center gap-2 border-l border-border pl-4">
                  <a
                    href={reportResult.files.docx.url}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-0 hover:bg-surface-2 border border-border text-text-primary rounded-lg font-medium transition-all text-[11px] shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-info" />
                    <span>Word</span>
                  </a>

                  <a
                    href={reportResult.files.pdf.url}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-0 hover:bg-surface-2 border border-border text-text-primary rounded-lg font-medium transition-all text-[11px] shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-amber" />
                    <span>PDF</span>
                  </a>

                  <a
                    href={reportResult.files.markdown.url}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-0 hover:bg-surface-2 border border-border text-text-primary rounded-lg font-medium transition-all text-[11px] shadow-xs"
                  >
                    <FileCode className="w-3.5 h-3.5 text-text-secondary" />
                    <span>MD</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Preview Document Area */}
          <div className="flex-1 overflow-hidden flex flex-col bg-surface-0 font-sans text-xs leading-relaxed text-text-primary min-h-[560px]">
            {reportResult ? (
              previewTab === "pdf" ? (
                <div className="flex-1 flex flex-col h-full min-h-[580px]">
                  <div className="flex items-center justify-between px-4 py-2 bg-surface-1 border-b border-border text-[11px] text-text-secondary">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Shield className="w-3.5 h-3.5 text-status-error" />
                      In-Site PDF Preview &bull; {reportResult.files.pdf.filename}
                    </span>
                    <div className="flex items-center gap-3">
                      <a
                        href={reportResult.files.pdf.view_url || `/api/view-report-pdf/${reportResult.files.pdf.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accent-hover underline"
                      >
                        Open In New Tab
                      </a>
                      <a
                        href={reportResult.files.pdf.url}
                        download
                        className="text-status-error hover:underline"
                      >
                        Direct Download
                      </a>
                    </div>
                  </div>
                  <iframe
                    src={`${reportResult.files.pdf.view_url || `/api/view-report-pdf/${reportResult.files.pdf.filename}`}#toolbar=0&navpanes=0&view=FitH`}
                    className="w-full flex-1 min-h-[550px] border-0 bg-white"
                    title="Official PDF Viewer"
                  />
                </div>
              ) : previewTab === "rendered" ? (
                <div className="p-6 overflow-y-auto max-h-[620px] space-y-3">
                  {renderMarkdownBlocks(reportResult.preview_text)}
                </div>
              ) : (
                <div className="p-6 overflow-y-auto max-h-[620px]">
                  <pre className="font-mono text-[11px] text-text-secondary whitespace-pre-wrap selection:bg-accent/30 selection:text-white">
                    {reportResult.preview_text}
                  </pre>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-tertiary space-y-3 py-20 text-center">
                <FileSpreadsheet className="w-12 h-12 text-text-tertiary stroke-1" />
                <div className="max-w-xs">
                  <p className="font-semibold text-text-secondary text-xs">No Report Synthesized Yet</p>
                  <p className="text-[11px] text-text-tertiary mt-1">
                    Select a report archetype and click <strong>"Generate Official Report"</strong> to prepare full Word, PDF, and Markdown volumes with zero token burn.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
