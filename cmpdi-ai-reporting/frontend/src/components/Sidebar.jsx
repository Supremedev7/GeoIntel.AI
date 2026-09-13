import React from "react";
import { 
  Bot, BarChart3, FileCheck, FolderArchive, Key, 
  Sun, Moon, Globe, Compass, PanelLeftClose, PanelLeftOpen,
  Layers
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";

export default function Sidebar({
  activeTab,
  onSelectTab,
  documentCount = 100,
  apiKey,
  onOpenKeyModal,
  onStartTour,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const { theme, setTheme, language, changeLanguage, t } = useAppContext();

  // Navigation sections categorized like modern desktop dashboards
  const navSections = [
    {
      title: "WORKSPACES",
      items: [
        { id: "dashboard", label: t('sidebar.analytics'), icon: BarChart3, badge: "1" },
        { id: "chat", label: t('sidebar.chat'), icon: Bot, badge: "2" },
        { id: "reports", label: t('sidebar.reports'), icon: FileCheck, badge: "3" },
      ]
    },
    {
      title: "DATA & REPOSITORY",
      items: [
        { id: "documents", label: t('sidebar.archive'), icon: FolderArchive, badge: `${documentCount}` },
      ]
    }
  ];

  const allNavItems = navSections.flatMap(s => s.items);

  // COLLAPSED STATE (Image 2 style: Completely line-free, icons centered in the vertical middle)
  if (isCollapsed) {
    return (
      <aside 
        className="h-full shrink-0 flex flex-col justify-between items-center py-3 px-2 select-none z-30 transition-all duration-300 ease-in-out w-[68px] bg-transparent border-none overflow-visible relative"
        id="tour-sidebar"
      >
        {/* Top: Brand emblem & expand button */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div 
            onClick={onToggleCollapse}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-hover text-white flex items-center justify-center shadow-md shadow-accent/25 cursor-pointer hover:scale-105 transition-transform"
            title="Expand sidebar"
          >
            <Layers className="w-4 h-4" />
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2/60 transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* CENTER: Navigation icons brought directly into the VERTICAL MIDDLE of the screen */}
        <div className="flex flex-col justify-center items-center gap-2.5 my-auto shrink-0 py-2">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group flex items-center justify-center">
                <button
                  onClick={() => onSelectTab(item.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-accent text-white shadow-lg shadow-accent/30 scale-105"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-2/70 hover:scale-105"
                  }`}
                  aria-label={item.label}
                >
                  <Icon className="w-4 h-4" />
                </button>

                {/* Sleek Floating Tooltip (Image 2 style) */}
                <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-surface-1 dark:bg-[#1E242B] border border-border text-xs text-text-primary font-semibold rounded-xl shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-[100] whitespace-nowrap flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-accent/15 text-accent font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom: Utilities */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          {/* Interactive Tour Icon */}
          {onStartTour && (
            <div className="relative group">
              <button
                onClick={onStartTour}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-2/70 text-text-secondary hover:text-accent transition-colors cursor-pointer"
                aria-label="Interactive Tour"
              >
                <Compass className="w-3.5 h-3.5 text-accent" />
              </button>
              <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-surface-1 dark:bg-[#1E242B] border border-border text-xs text-text-primary font-medium rounded-xl shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[100] whitespace-nowrap">
                Interactive Tour
              </div>
            </div>
          )}

          {/* API Key status icon */}
          <div className="relative group">
            <button
              onClick={onOpenKeyModal}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-2/70 text-text-secondary hover:text-text-primary transition-colors cursor-pointer relative"
              aria-label="API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span className={`w-2 h-2 rounded-full absolute top-1.5 right-1.5 ${apiKey ? "bg-status-success shadow-[0_0_6px_rgba(47,138,74,0.6)]" : "bg-status-warning shadow-[0_0_6px_rgba(201,138,43,0.6)]"}`} />
            </button>
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-surface-1 dark:bg-[#1E242B] border border-border text-xs text-text-primary font-medium rounded-xl shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[100] whitespace-nowrap">
              {apiKey ? "API Key Configured" : "Set API Key"}
            </div>
          </div>

          {/* Theme Toggle Icon */}
          <div className="relative group">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-2/70 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-surface-1 dark:bg-[#1E242B] border border-border text-xs text-text-primary font-medium rounded-xl shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[100] whitespace-nowrap">
              {theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </div>
          </div>

          {/* Language Toggle Icon */}
          <div className="relative group">
            <button
              onClick={() => {
                const langs = ["en", "hi", "bn", "ta"];
                const nextIdx = (langs.indexOf(language) + 1) % langs.length;
                changeLanguage(langs[nextIdx]);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-2/70 text-text-secondary hover:text-text-primary transition-colors uppercase font-mono text-[10.5px] font-bold cursor-pointer"
              aria-label="Language"
            >
              {language}
            </button>
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-surface-1 dark:bg-[#1E242B] border border-border text-xs text-text-primary font-medium rounded-xl shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[100] whitespace-nowrap">
              Language: {language.toUpperCase()}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // EXPANDED STATE (Image 1 style: Completely line-free, background blends into canvas, fills all except pages box)
  return (
    <aside 
      className="h-full shrink-0 flex flex-col justify-between select-none z-30 transition-all duration-300 ease-in-out w-[255px] py-3 px-3.5 bg-transparent border-none overflow-visible relative" 
      id="tour-sidebar"
    >
      {/* TOP SECTION: Brand & Navigation */}
      <div className="flex flex-col min-h-0 space-y-4">
        {/* Brand Header (NO dividing line) */}
        <div className="flex items-center justify-between px-1 pb-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-hover text-white flex items-center justify-center shrink-0 shadow-md shadow-accent/25">
              <Layers className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h1 className="text-[13.5px] font-bold tracking-tight text-text-primary truncate">
                {t('sidebar.brand')}
              </h1>
              <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider truncate">
                CMPDI Intelligence
              </p>
            </div>
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2/60 transition-colors cursor-pointer shrink-0"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections (NO dividing lines) */}
        <nav className="flex-1 overflow-y-auto space-y-4 pr-1">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary/70 px-2.5 pt-1 pb-1">
                {section.title}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${
                      isActive
                        ? "bg-accent text-white shadow-sm shadow-accent/20 font-semibold"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-2/60 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? "text-white" : "text-text-tertiary group-hover:text-text-primary"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10.5px] font-mono px-1.5 py-0.5 rounded-md shrink-0 transition-colors ${
                        isActive
                          ? "bg-white/20 text-white font-bold"
                          : "text-text-tertiary bg-surface-2/70 group-hover:text-text-secondary"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* BOTTOM SECTION: Utilities & Segmented Theme Pill (NO dividing line) */}
      <div className="pt-2 space-y-2">
        {/* API Key Modal Button */}
        <button
          onClick={onOpenKeyModal}
          id="tour-api-key"
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-0/60 hover:bg-surface-2/80 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer group shadow-xs"
          title={apiKey ? "Inference Key Configured" : "Set API Key"}
        >
          <div className="flex items-center gap-2.5">
            <Key className="w-3.5 h-3.5 text-text-tertiary group-hover:text-accent transition-colors" />
            <span className="truncate">{t('sidebar.api_key')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${apiKey ? "bg-status-success shadow-[0_0_6px_rgba(47,138,74,0.6)]" : "bg-status-warning shadow-[0_0_6px_rgba(201,138,43,0.6)]"}`} />
            <span className="text-[10px] text-text-tertiary font-mono">{apiKey ? "Active" : "Set Key"}</span>
          </div>
        </button>

        {/* Guide Tour Button */}
        <button
          onClick={onStartTour}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-surface-2/60 text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-accent" />
          <span>Interactive Tour</span>
        </button>

        {/* Segmented Pill: Theme Switcher & Language (NO dividing line above) */}
        <div className="flex items-center justify-between pt-1">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="appearance-none bg-transparent hover:bg-surface-2/60 border-0 rounded-lg pl-6 pr-3 py-1 text-[11px] text-text-secondary hover:text-text-primary focus:outline-none transition-colors cursor-pointer font-medium"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="bn">বাংলা</option>
              <option value="ta">தமிழ்</option>
            </select>
            <Globe className="w-3 h-3 text-text-tertiary absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Segmented Theme Pill */}
          <div className="flex items-center bg-surface-0/90 dark:bg-surface-1 border border-border/70 rounded-full p-0.5 shadow-xs">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                theme === 'light'
                  ? "bg-accent text-white shadow-xs font-semibold"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
              title="Switch to Light Mode"
            >
              <Sun className="w-3 h-3" />
              <span className="text-[10px]">Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                theme === 'dark'
                  ? "bg-accent text-white shadow-xs font-semibold"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
              title="Switch to Dark Mode"
            >
              <Moon className="w-3 h-3" />
              <span className="text-[10px]">Dark</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
