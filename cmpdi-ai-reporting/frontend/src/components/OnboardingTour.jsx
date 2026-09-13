import React, { useState, useEffect, useCallback } from "react";
import { 
  BarChart3, Cloud, Bot, Eye, FileCheck, 
  FolderArchive, ChevronRight, ChevronLeft, X, 
  Sparkles, ArrowUpRight
} from "lucide-react";

export default function OnboardingTour({ 
  isOpen, 
  onClose, 
  onNavigateTab,
  onSelectCitation,
  onAskAssistant,
  availableFiles = []
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 100, left: 100 });

  const tourSteps = [
    {
      id: "kpis",
      stepNumber: 1,
      tab: "dashboard",
      selector: "#tour-kpis",
      placement: "below",
      title: "Live Operational KPIs",
      icon: BarChart3,
      accentBg: "bg-amber/15 text-amber",
      desc: "Live coal production, drilling meterage, and overburden removal numbers aggregated directly from official Coal India reports."
    },
    {
      id: "wordcloud",
      stepNumber: 2,
      tab: "dashboard",
      selector: "#tour-word-cloud",
      placement: "inside-top-right",
      title: "Interactive Word Cloud",
      icon: Cloud,
      accentBg: "bg-teal/15 text-teal",
      desc: "Visualizes the most frequent mining terms. Click on ANY keyword (like CCL, ECL, or Opencast) to instantly see every document and sentence where it appears."
    },
    {
      id: "chat",
      stepNumber: 3,
      tab: "chat",
      selector: "#tour-chat-input",
      placement: "above",
      title: "AI Geological Assistant",
      icon: Bot,
      accentBg: "bg-accent/15 text-accent",
      desc: "Ask any question about mining plans, circulars, or subsidiaries in English, Hindi, Bengali, or Tamil to get instant verified answers.",
      actionText: "Try Sample Question",
      actionHandler: () => {
        if (onAskAssistant) {
          onAskAssistant("What are the coal production targets and stripping ratios for MCL?");
        }
      }
    },
    {
      id: "viewer",
      stepNumber: 4,
      tab: "chat",
      selector: "#tour-pdf-viewer",
      placement: "inside-top-left",
      title: "Split-Screen PDF & Exact Citations",
      icon: Eye,
      accentBg: "bg-amber/15 text-amber",
      desc: "Every AI response includes clickable page citation pills (like P.1). Click any pill to jump straight to that page with an amber highlight box over the exact sentence.",
      actionText: "Demo Citation Highlight",
      actionHandler: () => {
        if (onSelectCitation) {
          const doc = availableFiles[0] || "Coal_Ministry_Mine_Plan_Guidelines.pdf";
          onSelectCitation({
            source: doc,
            file_id: doc,
            page_number: 1,
            bbox: [100, 180, 480, 240],
            exact_snippet: "Barakar formation coal exploration and overburden removal metrics."
          });
        }
      }
    },
    {
      id: "reports",
      stepNumber: 5,
      tab: "reports",
      selector: "#tour-report-options",
      placement: "right",
      title: "One-Click Report Studio",
      icon: FileCheck,
      accentBg: "bg-success/15 text-success",
      desc: "Select an archetype and target subsidiary, then click 'Generate' to synthesize full executive reports downloadable as Word (.docx) or PDF (.pdf)."
    },
    {
      id: "repository",
      stepNumber: 6,
      tab: "documents",
      selector: "#tour-upload-zone",
      placement: "below",
      title: "Document Archive & Ingestion",
      icon: FolderArchive,
      accentBg: "bg-accent/15 text-accent",
      desc: "Drag and drop any mining PDF here to instantly index it into the system, or click 'Trigger Web Scraper' to fetch recent Ministry circulars."
    }
  ];

  const step = tourSteps[currentStep];
  const StepIcon = step.icon;

  // Calculate position with strict boundary clamping to guarantee it NEVER goes offscreen
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;
    const current = tourSteps[currentStep];
    const el = document.querySelector(current.selector);

    const cardWidth = Math.min(360, window.innerWidth - 32);
    const estimatedCardHeight = current.actionText ? 210 : 175;
    const pad = 16;

    if (!el) {
      // Fallback: perfectly centered on screen
      setTargetRect(null);
      setPopoverPos({
        top: Math.max(pad, (window.innerHeight - estimatedCardHeight) / 2),
        left: Math.max(pad, (window.innerWidth - cardWidth) / 2)
      });
      return;
    }

    const r = el.getBoundingClientRect();
    const elemPad = 8;
    const rect = {
      top: Math.max(0, r.top - elemPad),
      left: Math.max(0, r.left - elemPad),
      width: r.width + elemPad * 2,
      height: r.height + elemPad * 2,
      bottom: r.bottom + elemPad,
      right: r.right + elemPad,
    };

    setTargetRect(rect);

    let top = 0;
    let left = 0;

    switch (current.placement) {
      case "below":
        top = rect.bottom + 14;
        left = rect.left + (rect.width - cardWidth) / 2;
        // If placing below exceeds screen bottom, place above
        if (top + estimatedCardHeight > window.innerHeight - pad) {
          top = Math.max(pad, rect.top - estimatedCardHeight - 14);
        }
        break;

      case "above":
        top = rect.top - estimatedCardHeight - 14;
        left = rect.left + 20;
        // If placing above goes off top, place below
        if (top < pad) {
          top = rect.bottom + 14;
        }
        break;

      case "inside-top-right":
        top = rect.top + 70;
        left = rect.right - cardWidth - 24;
        break;

      case "inside-top-left":
        top = rect.top + 60;
        left = rect.left + 24;
        break;

      case "right":
        top = rect.top + 16;
        left = rect.right + 16;
        // If placing right goes off screen, place inside or below
        if (left + cardWidth > window.innerWidth - pad) {
          left = rect.left + 20;
          top = rect.bottom + 14;
        }
        break;

      default:
        top = rect.bottom + 14;
        left = rect.left + (rect.width - cardWidth) / 2;
        break;
    }

    // STRICT BOUNDARY CLAMPING: NEVER GOES OFFSCREEN IN ANY RESOLUTION
    const clampedTop = Math.max(pad, Math.min(top, window.innerHeight - estimatedCardHeight - pad));
    const clampedLeft = Math.max(pad, Math.min(left, window.innerWidth - cardWidth - pad));

    setPopoverPos({ top: clampedTop, left: clampedLeft });
  }, [isOpen, currentStep]);

  // Navigate to tab and scroll to element
  useEffect(() => {
    if (!isOpen) return;

    const current = tourSteps[currentStep];
    if (onNavigateTab && current.tab) {
      onNavigateTab(current.tab);
    }

    const timer = setTimeout(() => {
      const el = document.querySelector(current.selector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      updateTargetPosition();
    }, 180);

    return () => clearTimeout(timer);
  }, [isOpen, currentStep, onNavigateTab, updateTargetPosition]);

  // Update position on window resize/scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleResizeOrScroll = () => {
      updateTargetPosition();
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [isOpen, updateTargetPosition]);

  // Keyboard navigation (Left, Right, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto select-none overflow-hidden">
      {/* 1. Spotlight Overlay with SVG Cutout */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none transition-all duration-300">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="16"
                ry="16"
                fill="black"
                className="transition-all duration-300 ease-out"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.55)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* 2. Glowing Halo Border around the target element */}
      {targetRect && (
        <div
          style={{
            position: "fixed",
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
          className="rounded-2xl pointer-events-none ring-2 ring-accent shadow-[0_0_25px_rgba(58,127,168,0.55)] transition-all duration-300 ease-out"
        />
      )}

      {/* 3. Compact, Sweet & Simple Anchored Coachmark Card */}
      <div
        style={{
          position: "fixed",
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
        }}
        className="w-[360px] max-w-[calc(100vw-2rem)] pointer-events-auto z-50 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="tour-step-title"
      >
        <div className="bg-surface-1 dark:bg-[#181C20] border border-border rounded-2xl p-4 sm:p-4.5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl text-text-primary space-y-3">
          
          {/* Header Row: Icon, Step Badge, Title & Close */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl ${step.accentBg} flex items-center justify-center shrink-0 shadow-xs`}>
                <StepIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
                  Step {step.stepNumber} of {tourSteps.length}
                </span>
                <h3 id="tour-step-title" className="text-sm font-bold text-text-primary truncate">
                  {step.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-surface-2 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer shrink-0"
              title="Skip Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sweet & Simple Description: What you need to know */}
          <p className="text-xs text-text-secondary leading-relaxed pl-0.5">
            {step.desc}
          </p>

          {/* Optional Interactive Action Button */}
          {step.actionText && step.actionHandler && (
            <button
              onClick={step.actionHandler}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/25 text-xs font-semibold text-accent transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{step.actionText}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}

          {/* Footer Controls: Step Dots, Back, Next */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60 gap-2">
            {/* Step Dots */}
            <div className="flex items-center gap-1">
              {tourSteps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentStep === idx
                      ? "w-4 bg-accent shadow-xs"
                      : "w-1.5 bg-surface-3 hover:bg-text-tertiary/60"
                  }`}
                  title={`Step ${s.stepNumber}: ${s.title}`}
                />
              ))}
            </div>

            {/* Back & Next Buttons */}
            <div className="flex items-center gap-1.5">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-2.5 py-1 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-3.5 py-1 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-md shadow-accent/25 transition-all cursor-pointer"
              >
                <span>{currentStep === tourSteps.length - 1 ? "Done" : "Next"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
