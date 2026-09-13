import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, User, FileText, MapPin, Clock, Zap, Filter, Key, ArrowUp,
  FileCheck, Download, History, X, Shield, FileCode, CheckCircle2,
  Building2, Layers, Compass, Database, FileSpreadsheet, Plus,
  Mic, MicOff, Trash2, MessageSquare
} from "lucide-react";

const SESSIONS_STORAGE_KEY = "cmpdi_chat_sessions_v2";

const defaultAssistantMessage = {
  id: "initial-welcome-message",
  role: "assistant",
  content: "Hello! I am **GeoIntel Core**, developed for CMPDI & Coal India Limited.\n\nI have direct access to **official coal reports, drilling archives, and Detailed Project Reports (DPRs)** indexed in our spatial vector repository.\n\nYou can ask questions about national coal production, CMPDI drilling meterage, seam stratigraphy, or stripping ratios with interactive document citations.",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  citations: []
};

export default function ChatAssistant({ 
  onSelectCitation, 
  activeCitation,
  apiKey,
  onOpenKeyModal,
  availableFiles = [],
  selectedFile,
  onFileChange,
  initialQuery = "",
  onClearInitialQuery
}) {
  const [query, setQuery] = useState(initialQuery || "");
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setQuery(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState("chats"); // 'chats' or 'reports'
  const [reportsHistory, setReportsHistory] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showActionsPopover, setShowActionsPopover] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Multi-session chat history state
  const [currentSessionId, setCurrentSessionId] = useState(() => Date.now().toString());
  const [chatSessions, setChatSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [messages, setMessages] = useState([defaultAssistantMessage]);
  const messagesEndRef = useRef(null);
  const actionsPopoverRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN";

        recognition.onresult = (event) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            setQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListening(false);
        };

        recognition.onerror = (event) => {
          console.warn("Speech recognition notice:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn("Speech recognition init failed:", e);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn(e);
        setIsListening(false);
      }
    }
  };

  // Close actions popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsPopoverRef.current && !actionsPopoverRef.current.contains(e.target)) {
        setShowActionsPopover(false);
      }
    };
    if (showActionsPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showActionsPopover]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, generatingReport]);

  // Persist active conversation to chat sessions in localStorage
  useEffect(() => {
    const userMsg = messages.find((m) => m.role === "user");
    if (!userMsg) return;

    setChatSessions((prev) => {
      const title = userMsg.content.slice(0, 42) + (userMsg.content.length > 42 ? "..." : "");
      const existingIndex = prev.findIndex((s) => s.id === currentSessionId);
      let updated;
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          title,
          updatedAt: new Date().toISOString(),
          messages
        };
      } else {
        updated = [
          {
            id: currentSessionId,
            title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages
          },
          ...prev
        ];
      }
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated.slice(0, 30)));
      } catch {}
      return updated;
    });
  }, [messages, currentSessionId]);

  const fetchReportsHistory = async () => {
    setLoadingReports(true);
    try {
      const resp = await fetch("/api/reports-history");
      if (resp.ok) {
        const data = await resp.json();
        setReportsHistory(data.reports || []);
      }
    } catch (e) {
      console.error("Failed to load reports history:", e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReportsHistory();
  }, []);

  const handleNewChat = () => {
    setCurrentSessionId(Date.now().toString());
    setMessages([defaultAssistantMessage]);
    setQuery("");
    setShowActionsPopover(false);
  };

  const handleLoadSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || [defaultAssistantMessage]);
    setShowHistory(false);
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    setChatSessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId);
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (currentSessionId === sessionId) {
      handleNewChat();
    }
  };

  const handleClearAllSessions = () => {
    if (window.confirm("Are you sure you want to clear all chat history sessions?")) {
      setChatSessions([]);
      try {
        localStorage.removeItem(SESSIONS_STORAGE_KEY);
      } catch {}
      handleNewChat();
    }
  };

  const handleSend = async (textToSend) => {
    const q = textToSend || query;
    if (!q.trim() || loading || generatingReport) return;

    if (!apiKey) {
      if (onOpenKeyModal) onOpenKeyModal();
      return;
    }

    const userMessage = { role: "user", content: q };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const resp = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: q, 
          n_results: 4,
          api_key: apiKey,
          source_filter: selectedFile !== "all" ? selectedFile : undefined
        }),
      });

      if (!resp.ok) {
        if (resp.status === 401) {
          if (onOpenKeyModal) onOpenKeyModal();
          throw new Error("Groq API Key Required. Please configure your key to proceed.");
        }
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `API error: ${resp.status}`);
      }

      const data = await resp.json();
      const assistantMessage = {
        role: "assistant",
        content: data.answer,
        citations: data.citations || [],
        model: data.model || "Groq LLaMA 3.3 70B",
        latency_ms: data.latency_ms
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.citations && data.citations.length > 0) {
        onSelectCitation(data.citations[0], data.citations);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${err.message}`,
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReportDirect = async (promptText, presetType = "comprehensive_audit") => {
    const q = promptText || query || "Comprehensive operational audit and production review";
    if (!apiKey) {
      if (onOpenKeyModal) onOpenKeyModal();
      return;
    }

    setShowActionsPopover(false);
    const userMessage = { role: "user", content: `📑 Generate Official Technical Report: "${q}"` };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setGeneratingReport(true);

    try {
      const rawSelected = typeof selectedFile === "object" && selectedFile !== null ? (selectedFile.filename || "") : (selectedFile || "");
      const targetSub = rawSelected && rawSelected !== "all" 
        ? String(rawSelected).replace(".pdf", "").replace(/_/g, " ")
        : "All CIL Aggregate";

      const resp = await fetch("/api/generate-structured-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: presetType,
          subsidiary: targetSub,
          timeframe: "FY 2023-24",
          tone: "Formal Executive Brief",
          custom_prompt: q,
          api_key: apiKey
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `Report synthesis failed: ${resp.status}`);
      }

      const data = await resp.json();
      const reportMessage = {
        role: "assistant",
        isReport: true,
        base_name: data.base_name,
        content: data.preview_text,
        files: data.files,
        model: data.model || "Groq LLaMA 3.3 70B"
      };

      setMessages((prev) => [...prev, reportMessage]);
      fetchReportsHistory();
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Failed to generate report: ${err.message}`,
          citations: []
        }
      ]);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Enhanced Markdown parser with real table rendering and internal scroll bounds
  const renderContent = (content) => {
    if (!content) return null;
    const strContent = typeof content === "string" ? content : String(content);
    const lines = strContent.split("\n");
    const elements = [];
    let inTable = false;
    let tableRows = [];

    const flushTable = (key) => {
      if (tableRows.length === 0) return null;
      const headerRow = tableRows[0];
      const bodyRows = tableRows.slice(1);
      const tableEl = (
        <div key={`tbl-${key}`} className="my-3 overflow-x-auto rounded-xl border border-border bg-surface-0/90 shadow-sm max-w-full">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="bg-surface-2 text-text-primary border-b border-border">
              <tr>
                {headerRow.map((col, cIdx) => (
                  <th key={cIdx} className="px-3 py-2 font-bold whitespace-nowrap text-text-primary">
                    {col.replace(/\*\*/g, "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-surface-1/40" : "bg-transparent"}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 text-text-secondary font-medium">
                      {cell.replace(/\*\*/g, "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      return tableEl;
    };

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const lineTrim = line.trim();

      // Table line check
      if (lineTrim.startsWith("|") && lineTrim.endsWith("|")) {
        if (lineTrim.includes("---")) {
          continue; // Separator line
        }
        const cells = lineTrim.split("|").slice(1, -1).map((c) => c.trim());
        tableRows.push(cells);
        inTable = true;
        continue;
      } else if (inTable) {
        const tbl = flushTable(idx);
        if (tbl) elements.push(tbl);
        inTable = false;
      }

      if (line.startsWith("### ")) {
        elements.push(<h3 key={idx} className="text-xs font-bold text-accent mt-2.5 mb-1">{line.replace("### ", "")}</h3>);
      } else if (line.startsWith("## ")) {
        elements.push(<h2 key={idx} className="text-sm font-bold text-text-primary mt-3 mb-1 border-b border-border pb-1">{line.replace("## ", "")}</h2>);
      } else if (line.startsWith("# ")) {
        elements.push(<h1 key={idx} className="text-base font-extrabold text-text-primary mt-3 mb-2">{line.replace("# ", "")}</h1>);
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={idx} className="ml-4 list-disc text-text-primary text-xs my-0.5 leading-relaxed">
            {renderInlineMarkdown(line.substring(2))}
          </li>
        );
      } else if (/^\d+\.\s/.test(lineTrim)) {
        elements.push(
          <li key={idx} className="ml-4 list-decimal text-text-primary text-xs my-0.5 leading-relaxed">
            {renderInlineMarkdown(lineTrim.replace(/^\d+\.\s/, ""))}
          </li>
        );
      } else if (lineTrim.startsWith("> ")) {
        elements.push(
          <blockquote key={idx} className="border-l-2 border-accent pl-3 py-1 my-1 italic text-text-secondary text-xs bg-surface-1/40 rounded-r">
            {renderInlineMarkdown(lineTrim.replace("> ", ""))}
          </blockquote>
        );
      } else if (!lineTrim) {
        elements.push(<div key={idx} className="h-1" />);
      } else {
        elements.push(<p key={idx} className="text-xs text-text-primary my-1 leading-relaxed break-words">{renderInlineMarkdown(line)}</p>);
      }
    }

    if (inTable) {
      const tbl = flushTable(lines.length);
      if (tbl) elements.push(tbl);
    }

    return elements;
  };

  const renderInlineMarkdown = (text = "") => {
    if (!text) return "";
    const strText = typeof text === "string" ? text : String(text);
    const parts = strText.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-text-primary">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="font-mono text-[11px] bg-surface-2 text-amber-600 dark:text-amber-400 px-1 py-0.5 rounded border border-border">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const quickActionOptions = [
    {
      id: "report_now",
      title: "Generate Formal Technical Report",
      desc: "Synthesize executive report in DOCX, PDF & Markdown with document citations",
      icon: FileCheck,
      action: () => handleGenerateReportDirect(query || "Executive Operational Audit and Production Review")
    },
    {
      id: "exec_perf",
      title: "Executive Performance Audit",
      desc: "National coal production, subsidiary growth rates & FMC logistics",
      icon: Building2,
      action: () => {
        const p = "Summarize national coal production, subsidiary growth rates, and FMC logistics for FY 2023-24";
        setQuery(p);
        handleSend(p);
        setShowActionsPopover(false);
      }
    },
    {
      id: "obr_strip",
      title: "OBR & Stripping Analysis",
      desc: "Overburden removal dynamics & HEMM fleet utilization across opencast mines",
      icon: Layers,
      action: () => {
        const p = "Analyze Overburden Removal (OBR) dynamics, stripping ratios, and HEMM utilization across opencast mines";
        setQuery(p);
        handleSend(p);
        setShowActionsPopover(false);
      }
    },
    {
      id: "strat_drill",
      title: "Stratigraphy & Drilling Meterage",
      desc: "Barakar formation stratigraphy, CMPDI exploratory drilling & seismic surveys",
      icon: Compass,
      action: () => {
        const p = "Detail CMPDI exploratory drilling meterage, Barakar formation stratigraphy, and 2D/3D seismic survey results";
        setQuery(p);
        handleSend(p);
        setShowActionsPopover(false);
      }
    },
    {
      id: "cbm_coal",
      title: "CBM & Clean Coal Beneficiation",
      desc: "Coal Bed Methane reserves in Jharia/Bokaro deep seams & washery yields",
      icon: Database,
      action: () => {
        const p = "Provide assessment of Coal Bed Methane reserves in Jharia and Bokaro deep seams and washery beneficiation";
        setQuery(p);
        handleSend(p);
        setShowActionsPopover(false);
      }
    }
  ];

  return (
    <div className="flex flex-col h-full bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-2xl min-h-0">
      {/* Top Header Row: Identity + New Chat + Unified History */}
      <div className="px-4 py-2.5 bg-surface-1 border-b border-border flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-teal/10 border border-teal/25 flex items-center justify-center text-teal shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-text-primary truncate">GeoIntel Assistant</span>
            <span className="w-1.5 h-1.5 rounded-full bg-status-success shrink-0" />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleNewChat}
            className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary border border-border text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Start new conversation thread"
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
            <span>New Chat</span>
          </button>

          <button
            onClick={() => {
              setShowHistory(true);
              fetchReportsHistory();
            }}
            className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary border border-border text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="View Chat Sessions & Generated Report Archives"
          >
            <History className="w-3.5 h-3.5 text-accent" />
            <span>History</span>
            <span className="text-[10.5px] text-text-tertiary">({chatSessions.length + reportsHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-Header Row: Dedicated Full-Width Document Scope Bar */}
      <div className="px-4 py-1.5 bg-surface-2/40 border-b border-border flex items-center gap-2 text-xs shrink-0">
        <Filter className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
        <span className="text-[11px] text-text-tertiary shrink-0">Corpus Scope:</span>
        <select
          value={typeof selectedFile === "object" && selectedFile !== null ? (selectedFile.filename || "all") : (selectedFile || "all")}
          onChange={(e) => onFileChange && onFileChange(e.target.value)}
          className="bg-transparent text-text-primary text-xs font-medium focus:outline-none cursor-pointer truncate flex-1 min-w-0"
          title="Filter retrieval source document"
        >
          <option value="all">All Indexed Documents (100+)</option>
          {availableFiles.map((f, i) => {
            const fname = typeof f === "string" ? f : (f?.filename || "");
            if (!fname) return null;
            return (
              <option key={fname || i} value={fname}>
                {fname.replace(".pdf", "").replace(/_/g, " ")}
              </option>
            );
          })}
        </select>
      </div>

      {/* Message Stream: Strict Internal Scrollability */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans bg-transparent min-h-0">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 max-w-full ${m.role === "user" ? "ml-auto justify-end" : "mr-auto justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-teal/10 border border-teal/25 flex items-center justify-center text-teal shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[88%] sm:max-w-[82%] shadow-sm ${
                m.role === "user"
                  ? "bg-accent text-white font-medium rounded-tr-none shadow-sm shadow-accent/20"
                  : "bg-surface-0 border border-border text-text-primary rounded-tl-none"
              }`}
            >
              {/* Structured Report Banner if message is a generated report */}
              {m.isReport && (
                <div className="mb-3 pb-3 border-b border-border">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <span className="text-[11px] font-bold text-success flex items-center gap-1.5 bg-success/10 px-2.5 py-1 rounded-lg border border-success/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      Official Report Synthesized
                    </span>
                    <span className="text-[10px] text-text-tertiary font-mono truncate max-w-[200px]">
                      {m.base_name}
                    </span>
                  </div>

                  {/* 3 Explicit Format Download Buttons */}
                  {m.files && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {m.files.docx && (
                        <a
                          href={typeof m.files.docx === "string" ? m.files.docx : m.files.docx?.url}
                          download
                          className="flex items-center gap-1 px-2.5 py-1 bg-info/10 hover:bg-info/20 border border-info/30 text-info rounded-lg text-[11px] font-medium transition-colors"
                        >
                          <FileText className="w-3 h-3 text-info" />
                          <span>Word (.docx)</span>
                          <Download className="w-2.5 h-2.5 ml-0.5" />
                        </a>
                      )}
                      {m.files.pdf && (
                        <a
                          href={typeof m.files.pdf === "string" ? m.files.pdf : m.files.pdf?.url}
                          download
                          className="flex items-center gap-1 px-2.5 py-1 bg-amber/10 hover:bg-amber/20 border border-amber/30 text-amber rounded-lg text-[11px] font-medium transition-colors"
                        >
                          <Shield className="w-3 h-3 text-amber" />
                          <span>PDF (.pdf)</span>
                          <Download className="w-2.5 h-2.5 ml-0.5" />
                        </a>
                      )}
                      {m.files.markdown && (
                        <a
                          href={typeof m.files.markdown === "string" ? m.files.markdown : m.files.markdown?.url}
                          download
                          className="flex items-center gap-1 px-2.5 py-1 bg-surface-2 hover:bg-surface-3 border border-border text-text-primary rounded-lg text-[11px] font-medium transition-colors"
                        >
                          <FileCode className="w-3 h-3 text-text-secondary" />
                          <span>Markdown (.md)</span>
                          <Download className="w-2.5 h-2.5 ml-0.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Message text rendering */}
              <div className="space-y-1">
                {renderContent(m.content)}
              </div>

              {/* Verified Citations block */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-border space-y-1.5">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber" />
                    <span>Spatial Citations (Click to View in PDF):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.citations.map((c, i) => {
                      const docName = String(c?.source || c?.file_id || "Document.pdf").replace(".pdf", "");
                      const pageNo = c?.page_number || 1;
                      const isSelected = activeCitation?.bbox && activeCitation.source === c?.source && activeCitation.page_number === c?.page_number;
                      return (
                        <button
                          key={i}
                          onClick={() => onSelectCitation && onSelectCitation(c, m.citations)}
                          className={`text-[11px] px-2.5 py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                            isSelected
                              ? "bg-amber/20 text-amber border-amber shadow-sm shadow-amber/20 ring-1 ring-amber/50 font-bold"
                              : "bg-surface-0 hover:bg-surface-2 text-text-primary border-border hover:border-accent/40"
                          }`}
                          title={`[REF #${i + 1}] ${docName} • Page ${pageNo}: ${c?.exact_snippet || c?.text || ""}`}
                        >
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-accent/10 text-accent border border-accent/25 shrink-0">
                            REF #{i + 1}
                          </span>
                          <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="font-semibold truncate max-w-[130px]">{docName}</span>
                          <span className="text-amber font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-amber/10 border border-amber/25 shrink-0">
                            P.{pageNo}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-surface-3 border border-border flex items-center justify-center text-text-primary shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 items-center text-text-secondary text-xs p-2">
            <div className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin shrink-0" />
            <span>Searching documents & synthesizing analysis...</span>
          </div>
        )}

        {generatingReport && (
          <div className="flex gap-2.5 items-center text-text-secondary text-xs p-3 bg-teal/10 border border-teal/20 rounded-xl">
            <div className="w-4 h-4 border-2 border-amber border-t-transparent rounded-full animate-spin shrink-0" />
            <span>Compiling structured technical report and generating DOCX/PDF artifacts...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pro Chatbot Input Bar (With '+' Actions Popover & Web Speech Mic) */}
      <div className="p-3 bg-surface-1 border-t border-border relative shrink-0">
        {!apiKey ? (
          <div className="flex items-center justify-between p-2.5 bg-amber/10 border border-amber/30 rounded-xl text-xs text-amber">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber shrink-0" />
              <span>Groq API Key Required for model inference and report generation.</span>
            </div>
            <button
              onClick={onOpenKeyModal}
              className="bg-accent hover:bg-accent-hover text-white font-semibold px-3 py-1 rounded-lg text-xs transition-colors"
            >
              Configure Key
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            id="tour-chat-input"
            className="relative flex items-center gap-1.5 bg-surface-0 border border-border rounded-full px-2.5 py-1.5 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/25 shadow-sm transition-all"
          >
            {/* Pro Chatbot '+' Action Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActionsPopover(!showActionsPopover)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  showActionsPopover
                    ? "bg-accent text-white rotate-45 shadow-sm"
                    : "bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary"
                }`}
                title="Actions & Report Presets"
                aria-label="Open Actions Menu"
              >
                <Plus className="w-4 h-4 transition-transform duration-200" />
              </button>

              {/* Actions Popover Menu */}
              {showActionsPopover && (
                <div
                  ref={actionsPopoverRef}
                  className="absolute bottom-10 left-0 w-80 bg-surface-0 border border-border rounded-2xl shadow-2xl p-2 z-50 animate-fade-in space-y-1"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                    Quick Actions & Reports
                  </div>
                  {quickActionOptions.map((opt) => {
                    const OptIcon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={opt.action}
                        className="w-full text-left p-2 rounded-xl hover:bg-surface-2 transition-colors flex items-start gap-2.5 group"
                      >
                        <div className="p-1.5 rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 shrink-0">
                          <OptIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                            {opt.title}
                          </div>
                          <div className="text-[10.5px] text-text-tertiary line-clamp-1">
                            {opt.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  <div className="pt-1 border-t border-border mt-1">
                    <button
                      type="button"
                      onClick={handleNewChat}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-status-error/10 text-status-error text-xs font-medium flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Chat Thread</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Text Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about coal production, stratigraphy, or type report topic..."
              className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none py-1 px-1.5 min-w-0"
              disabled={loading || generatingReport}
            />

            {/* Voice Input / Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                isListening
                  ? "bg-status-error text-white animate-pulse shadow-md shadow-status-error/30"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
              }`}
              title={isListening ? "Listening... click to stop" : "Voice Input (Microphone)"}
              aria-label="Toggle Voice Input"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || generatingReport || !query.trim()}
              className="w-7 h-7 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center disabled:opacity-40 transition-colors shadow shrink-0"
              title="Send Inquiry"
              aria-label="Send Query"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Unified History Modal: Dual Tabbed (Chat Sessions + Report Archives) */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-0 border border-border rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-text-primary">
                  Intelligence & Activity History
                </h2>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-text-tertiary hover:text-text-primary p-1 rounded-lg hover:bg-surface-2"
                aria-label="Close History"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dual Tabs: Chat Sessions vs Generated Reports */}
            <div className="flex items-center gap-2 border-b border-border pb-2 shrink-0">
              <button
                onClick={() => setHistoryTab("chats")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  historyTab === "chats"
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat Sessions ({chatSessions.length})</span>
              </button>

              <button
                onClick={() => setHistoryTab("reports")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  historyTab === "reports"
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Generated Reports ({reportsHistory.length})</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {historyTab === "chats" ? (
                chatSessions.length === 0 ? (
                  <div className="text-center py-12 text-text-tertiary space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-text-tertiary/60 stroke-1" />
                    <p className="text-xs font-semibold text-text-secondary">No Saved Chat Sessions</p>
                    <p className="text-[11px]">Conversations with user queries are automatically saved here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1 pb-1">
                      <span className="text-[11px] text-text-tertiary">Select a conversation to resume:</span>
                      <button
                        onClick={handleClearAllSessions}
                        className="text-[10px] text-status-error hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear All
                      </button>
                    </div>
                    {chatSessions.map((sess) => (
                      <div
                        key={sess.id}
                        onClick={() => handleLoadSession(sess)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                          currentSessionId === sess.id
                            ? "bg-accent/10 border-accent/40 text-accent font-semibold"
                            : "bg-surface-1/60 hover:bg-surface-2 border-border text-text-primary"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MessageSquare className="w-4 h-4 text-accent shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate group-hover:text-accent transition-colors">
                              {sess.title}
                            </div>
                            <div className="text-[10px] text-text-tertiary">
                              {new Date(sess.updatedAt || sess.createdAt).toLocaleString()} &bull; {sess.messages?.length || 0} messages
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(e, sess.id)}
                          className="p-1 rounded-md text-text-tertiary hover:text-status-error hover:bg-status-error/10 transition-colors shrink-0"
                          title="Delete this session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                loadingReports ? (
                  <div className="text-center py-8 text-text-tertiary text-xs">
                    Loading report archives...
                  </div>
                ) : reportsHistory.length === 0 ? (
                  <div className="text-center py-12 text-text-tertiary space-y-2">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-text-tertiary/60 stroke-1" />
                    <p className="text-xs font-semibold text-text-secondary">No Generated Reports Yet</p>
                    <p className="text-[11px]">Use the '+' button in chat or the Report Builder to synthesize official documents.</p>
                  </div>
                ) : (
                  reportsHistory.map((rep, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-surface-1/60 border border-border rounded-xl hover:border-accent/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text-primary truncate">
                          {rep.title}
                        </div>
                        <div className="text-[10px] text-text-tertiary mt-0.5">
                          Generated on {rep.date} &bull; {rep.size_kb} KB
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {rep.files?.docx && (
                          <a
                            href={rep.files.docx}
                            download
                            className="px-2 py-1 bg-info/10 hover:bg-info/20 text-info border border-info/25 rounded text-[10.5px] font-medium flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>DOCX</span>
                          </a>
                        )}
                        {rep.files?.pdf && (
                          <a
                            href={rep.files.pdf}
                            download
                            className="px-2 py-1 bg-amber/10 hover:bg-amber/20 text-amber border border-amber/25 rounded text-[10.5px] font-medium flex items-center gap-1"
                          >
                            <Shield className="w-3 h-3" />
                            <span>PDF</span>
                          </a>
                        )}
                        {rep.files?.markdown && (
                          <a
                            href={rep.files.markdown}
                            download
                            className="px-2 py-1 bg-surface-0 hover:bg-surface-2 text-text-primary border border-border rounded text-[10.5px] font-medium flex items-center gap-1"
                          >
                            <FileCode className="w-3 h-3" />
                            <span>MD</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-border flex justify-end shrink-0">
              <button
                onClick={() => setShowHistory(false)}
                className="text-xs text-text-secondary hover:text-text-primary bg-surface-2 px-3.5 py-1.5 rounded-xl transition-colors"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
