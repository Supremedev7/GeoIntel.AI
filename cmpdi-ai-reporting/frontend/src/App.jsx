import React, { useState, useEffect } from 'react';
import { Key, X } from 'lucide-react';

import Sidebar from './components/Sidebar';
import ChatAssistant from './components/ChatAssistant';
import PDFHighlightViewer from './components/PDFHighlightViewer';
import Dashboard from './components/Dashboard';
import ReportBuilder from './components/ReportBuilder';
import Repository from './components/Repository';
import OnboardingTour from './components/OnboardingTour';
import LandingPage from './components/LandingPage';
import ArchitecturePage from './components/ArchitecturePage';
import PlatformAmbientBackground from './components/PlatformAmbientBackground';

export default function App() {
  const getInitialTab = () => {
    try {
      const hash = window.location.hash.replace('#', '');
      if (['landing', 'dashboard', 'chat', 'reports', 'documents', 'architecture'].includes(hash)) {
        return hash;
      }
    } catch (e) {}
    return 'landing';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('Coal_Ministry_Mine_Plan_Guidelines.pdf');
  const [activePage, setActivePage] = useState(1);
  const [activeBBox, setActiveBBox] = useState([54.0, 72.0, 558.0, 110.0]);
  const [activeSnippet, setActiveSnippet] = useState('Guidelines for preparation of Mine Plans for Coal and Lignite Blocks');
  const [activeCitation, setActiveCitation] = useState({
    source: 'Coal_Ministry_Mine_Plan_Guidelines.pdf',
    page_number: 1,
    bbox: [54.0, 72.0, 558.0, 110.0],
    exact_snippet: 'Guidelines for preparation of Mine Plans for Coal and Lignite Blocks'
  });
  const [activeCitations, setActiveCitations] = useState([]);
  
  const getStoredKey = () => {
    try {
      return localStorage.getItem('groq_api_key') || '';
    } catch (e) {
      return '';
    }
  };

  const [apiKey, setApiKey] = useState(getStoredKey());
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(getStoredKey());
  const [validatingKey, setValidatingKey] = useState(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const fetchDocuments = async () => {
    try {
      const resp = await fetch('/api/documents');
      if (resp.ok) {
        const data = await resp.json();
        setAvailableFiles(data.documents || []);
        if (data.documents && data.documents.length > 0 && !selectedFile) {
          setSelectedFile(data.documents[0].filename);
        }
      }
    } catch (e) {
      console.error("Failed to load documents:", e);
    }
  };

  useEffect(() => {
    fetchDocuments();

    if (!apiKey) {
      fetch('/api/config')
        .then((r) => (r.ok ? r.json() : null))
        .then((cfg) => {
          if (cfg && cfg.default_api_key) {
            setApiKey(cfg.default_api_key);
            setKeyInput(cfg.default_api_key);
            setShowKeyModal(false);
            try {
              localStorage.setItem('groq_api_key', cfg.default_api_key);
            } catch (e) {}
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSelectCitation = (citation, allCitations = null) => {
    if (!citation) return;
    setActiveCitation(citation);
    if (allCitations && Array.isArray(allCitations)) {
      setActiveCitations(allCitations);
    } else if (citation) {
      setActiveCitations([citation]);
    }
    if (citation.source || citation.file_id) {
      setSelectedFile(citation.source || citation.file_id);
    }
    if (citation.page_number) {
      setActivePage(Number(citation.page_number));
    }
    if (citation.bbox) {
      setActiveBBox(citation.bbox);
    }
    if (citation.exact_snippet || citation.text) {
      setActiveSnippet(citation.exact_snippet || citation.text);
    }
  };

  const handleAuditDocument = (filename, page = 1) => {
    setSelectedFile(filename);
    setActivePage(Number(page) || 1);
    setActiveCitation(null);
    setActiveBBox(null);
    setActiveSnippet('');
    setActiveCitations([]);
    setActiveTab('chat');
  };

  const handleValidateAndSaveKey = async () => {
    const k = keyInput.trim();
    if (!k) {
      setKeyValidationStatus({ valid: false, message: "Please enter a valid Groq API key." });
      return;
    }

    setValidatingKey(true);
    setKeyValidationStatus(null);

    try {
      const resp = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: k })
      });

      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setApiKey(k);
        localStorage.setItem('groq_api_key', k);
        const modelLabel = data.model ? ` (${data.model} active)` : ' (Hardware Acceleration Active)';
        setKeyValidationStatus({ valid: true, message: `Groq API Key verified!${modelLabel}` });
        setTimeout(() => setShowKeyModal(false), 1200);
      } else {
        const err = await resp.json().catch(() => ({}));
        setKeyValidationStatus({ valid: false, message: err.detail || "Invalid Groq API key or network error." });
      }
    } catch (e) {
      // If network probe fails, allow saving key anyway
      setApiKey(k);
      localStorage.setItem('groq_api_key', k);
      setKeyValidationStatus({ valid: true, message: "Key saved to local session." });
      setTimeout(() => setShowKeyModal(false), 1000);
    } finally {
      setValidatingKey(false);
    }
  };

  const handleClearKey = () => {
    setApiKey('');
    setKeyInput('');
    localStorage.removeItem('groq_api_key');
    setKeyValidationStatus(null);
  };

  useEffect(() => {
    try {
      if (activeTab === 'landing') {
        const h = window.location.hash;
        if (h && !['#top', '#challenge', '#platform', '#impact', '#roadmap', '#contact', '#landing'].includes(h)) {
          window.history.replaceState(null, '', '#landing');
        }
      } else {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
    } catch (e) {}
  }, [activeTab]);

  // Dynamically toggle landing-mode class so LandingPage and ArchitecturePage scroll naturally while Platform Workspace remains 100% fixed
  useEffect(() => {
    if (activeTab === 'landing' || activeTab === 'architecture') {
      document.documentElement.classList.add('landing-mode');
      return () => {
        document.documentElement.classList.remove('landing-mode');
      };
    } else {
      document.documentElement.classList.remove('landing-mode');
    }
  }, [activeTab]);

  if (activeTab === 'landing') {
    return (
      <div className="w-full min-h-full bg-[#0B0E12] text-[#F0F3F6] overflow-visible">
        <LandingPage 
          onLaunchPlatform={(targetTab) => {
            setActiveTab(targetTab || 'dashboard');
          }} 
          onOpenArchitecture={() => setActiveTab('architecture')}
        />
      </div>
    );
  }

  if (activeTab === 'architecture') {
    return (
      <div className="w-full min-h-full bg-[#0B0E12] text-[#F0F3F6] overflow-visible">
        <ArchitecturePage 
          onBackToLanding={() => setActiveTab('landing')}
          onLaunchPlatform={(targetTab) => {
            setActiveTab(targetTab || 'dashboard');
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-full w-full overflow-hidden bg-[#EBEEF2] dark:bg-[#0E1217] text-text-primary selection:bg-accent/30 selection:text-white flex relative">
      {/* Ambient dust and floating geometry surrounding the sidebar space */}
      <PlatformAmbientBackground isSidebarCollapsed={isSidebarCollapsed} />

      {/* Sidebar Navigation (Borderless & seamless with outer canvas) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        documentCount={availableFiles.length}
        apiKey={apiKey}
        onOpenKeyModal={() => setShowKeyModal(true)}
        onStartTour={() => setIsTourOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Stage: Sleek Floating Rounded Panel (The "Pages Box") */}
      <main className="flex-1 flex flex-col min-w-0 h-full p-3 relative z-10 overflow-hidden">
        <div className="flex-1 overflow-hidden w-full h-full bg-white dark:bg-[#161B22] rounded-2xl md:rounded-[20px] border border-border/80 dark:border-white/[0.06] shadow-2xl shadow-black/5 dark:shadow-black/50 flex flex-col relative">
          {activeTab === 'chat' && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[450px_minmax(0,1fr)] gap-3 md:gap-4 p-3 md:p-4 min-h-0 min-w-0 h-full w-full overflow-hidden">
              <div className="h-full flex flex-col min-h-0 min-w-0 overflow-hidden">
                <ChatAssistant
                  onSelectCitation={handleSelectCitation}
                  activeCitation={activeCitation}
                  apiKey={apiKey}
                  onOpenKeyModal={() => setShowKeyModal(true)}
                  availableFiles={availableFiles}
                  selectedFile={selectedFile}
                  initialQuery={chatInitialQuery}
                  onClearInitialQuery={() => setChatInitialQuery('')}
                  onFileChange={(f) => {
                    setSelectedFile(f);
                    setActivePage(1);
                    setActiveBBox(null);
                    setActiveSnippet('');
                  }}
                />
              </div>
              <div className="h-full min-h-0 min-w-0 overflow-hidden">
                <PDFHighlightViewer
                  selectedFile={selectedFile}
                  activeCitation={activeCitation}
                  citations={activeCitations}
                  availableFiles={availableFiles}
                  onFileChange={(f) => {
                    setSelectedFile(f);
                    setActiveCitation(null);
                    setActiveCitations([]);
                    setActiveBBox(null);
                    setActiveSnippet('');
                  }}
                  onPageChange={(p) => setActivePage(p)}
                />
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="h-full w-full mx-auto overflow-y-auto p-4 md:p-6 pb-12">
              <Dashboard 
                onAuditDocument={(filename, page) => {
                  setSelectedFile(filename);
                  setActivePage(page || 1);
                  setActiveBBox(null);
                  setActiveSnippet('');
                  setActiveTab('chat');
                }} 
                onAskAssistant={(queryText) => {
                  setChatInitialQuery(queryText);
                  setActiveTab('chat');
                }}
              />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="h-full w-full mx-auto overflow-y-auto p-4 md:p-6 pb-12">
              <ReportBuilder 
                apiKey={apiKey} 
                availableFiles={availableFiles} 
              />
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="h-full w-full mx-auto overflow-y-auto p-4 md:p-6 pb-12">
              <Repository
                availableFiles={availableFiles}
                onRefresh={fetchDocuments}
                onSelectForAudit={handleAuditDocument}
              />
            </div>
          )}
        </div>
      </main>

      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="api-key-modal-title"
            className="bg-surface-1 border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-text-primary relative m-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 id="api-key-modal-title" className="text-sm font-bold text-text-primary">
                  Groq Inference API Key
                </h2>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  Optional: Keys are stored only in your local browser session.
                </p>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="apiKeyInput" className="text-xs font-semibold text-text-secondary block">
                  API Key (gsk_...)
                </label>
                <input
                  id="apiKeyInput"
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-surface-0 border border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors font-mono"
                />
              </div>

              {keyValidationStatus && (
                <div className={`p-3 rounded-xl border text-xs ${
                  keyValidationStatus.valid
                    ? 'bg-status-success/10 border-status-success/20 text-status-success'
                    : 'bg-status-error/10 border-status-error/20 text-status-error'
                }`}>
                  {keyValidationStatus.message}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
                {apiKey ? (
                  <button
                    onClick={handleClearKey}
                    className="text-xs text-text-secondary hover:text-status-error transition-colors px-2 py-1.5 cursor-pointer font-medium"
                  >
                    Clear Key
                  </button>
                ) : (
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1.5 cursor-pointer font-medium"
                  >
                    Close
                  </button>
                )}

                <button
                  onClick={handleValidateAndSaveKey}
                  disabled={validatingKey || !keyInput.trim()}
                  className="bg-accent hover:bg-accent-hover text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-accent/25 cursor-pointer"
                >
                  {validatingKey ? "Validating..." : "Save Key"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modern Interactive Onboarding Tour */}
      {isTourOpen && (
        <OnboardingTour 
          isOpen={isTourOpen} 
          onClose={() => setIsTourOpen(false)} 
          onNavigateTab={setActiveTab}
          onSelectCitation={handleSelectCitation}
          onAskAssistant={(query) => {
            setChatInitialQuery(query);
            setActiveTab('chat');
          }}
          availableFiles={availableFiles}
        />
      )}
    </div>
  );
}
