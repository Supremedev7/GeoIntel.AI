import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Layers, Sparkles, Database, BarChart3, Bot, FileText, ChevronRight } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ onLaunchPlatform, onOpenArchitecture }) {
  const containerRef = useRef(null);
  const dustCanvasRef = useRef(null);
  const cursorRingRef = useRef(null);
  const cursorDotRef = useRef(null);
  const navRef = useRef(null);
  const navTickerRef = useRef(null);
  const hfcValueRef = useRef(null);
  const mockReportRef = useRef(null);
  const wordCloudRef = useRef(null);
  const terminalRef = useRef(null);
  const termBodyRef = useRef(null);
  const statRowRef = useRef(null);
  const timelineFillRef = useRef(null);

  const handleLaunch = (tab = 'dashboard') => {
    if (onLaunchPlatform) {
      onLaunchPlatform(tab);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const cleanups = [];

    const root = containerRef.current;
    if (!root) return;

    /* 1. Nav Scroll State */
    const navEl = navRef.current;
    const handleScrollNav = () => {
      if (navEl) {
        navEl.classList.toggle('scrolled', window.scrollY > 40);
      }
    };
    window.addEventListener('scroll', handleScrollNav, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', handleScrollNav));

    /* 2. Nav Ticker */
    const tickerMsgs = [
      "128,402 borehole & lithology folios indexed",
      "42 active stratigraphic seam profiles",
      "Dossier synthesis pipeline: 3 pending",
      "Subsurface geological archive: 1962–2026"
    ];
    let tIdx = 0;
    const tickerEl = navTickerRef.current;
    if (tickerEl) {
      tickerEl.textContent = tickerMsgs[0];
      const tickerTimer = setInterval(() => {
        if (!isMounted) return;
        tickerEl.style.opacity = '0';
        setTimeout(() => {
          if (!isMounted) return;
          tIdx = (tIdx + 1) % tickerMsgs.length;
          tickerEl.textContent = tickerMsgs[tIdx];
          tickerEl.style.opacity = '1';
        }, 400);
      }, 3800);
      cleanups.push(() => clearInterval(tickerTimer));
    }

    /* 3. Hero Floating Accuracy Jitter */
    const hfc = hfcValueRef.current;
    const vals = ['99.2%', '99.4%', '99.1%', '99.3%'];
    let vIdx = 0;
    if (hfc) {
      const hfcTimer = setInterval(() => {
        if (!isMounted) return;
        vIdx = (vIdx + 1) % vals.length;
        hfc.style.opacity = '0';
        setTimeout(() => {
          if (!isMounted) return;
          hfc.textContent = vals[vIdx];
          hfc.style.opacity = '1';
        }, 250);
      }, 2600);
      cleanups.push(() => clearInterval(hfcTimer));
    }

    /* 4. Ambient Layers: Cursor, Dust Canvas, Parallax */
    const finePointer = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dustCanvas = dustCanvasRef.current;
    const cursorRing = cursorRingRef.current;
    const cursorDot = cursorDotRef.current;

    if (finePointer && !reducedMotion) {
      root.classList.add('has-cursor');

      // Mouse Follower
      if (cursorRing && cursorDot) {
        let mx = window.innerWidth / 2;
        let my = window.innerHeight / 2;
        let rx = mx;
        let ry = my;
        let cursorAnimId;

        const handleMouseMove = (e) => {
          mx = e.clientX;
          my = e.clientY;
          if (cursorDot) {
            cursorDot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
          }
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        cleanups.push(() => window.removeEventListener('mousemove', handleMouseMove));

        const cursorLoop = () => {
          if (!isMounted) return;
          rx += (mx - rx) * 0.16;
          ry += (my - ry) * 0.16;
          if (cursorRing) {
            cursorRing.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
          }
          cursorAnimId = requestAnimationFrame(cursorLoop);
        };
        cursorLoop();
        cleanups.push(() => cancelAnimationFrame(cursorAnimId));

        const interactiveEls = root.querySelectorAll('a, button, .btn, .nav-btn-app');
        const handleMouseEnter = () => cursorRing?.classList.add('hover');
        const handleMouseLeave = () => cursorRing?.classList.remove('hover');

        interactiveEls.forEach((el) => {
          el.addEventListener('mouseenter', handleMouseEnter);
          el.addEventListener('mouseleave', handleMouseLeave);
        });
        cleanups.push(() => {
          interactiveEls.forEach((el) => {
            el.removeEventListener('mouseenter', handleMouseEnter);
            el.removeEventListener('mouseleave', handleMouseLeave);
          });
        });
      }

      // Dust Particles (Crisp light mineral dust for dark aesthetic)
      if (dustCanvas) {
        const ctx = dustCanvas.getContext && dustCanvas.getContext('2d');
        if (ctx) {
          let W = (dustCanvas.width = window.innerWidth);
          let H = (dustCanvas.height = window.innerHeight);
          const handleResizeDust = () => {
            W = dustCanvas.width = window.innerWidth;
            H = dustCanvas.height = window.innerHeight;
          };
          window.addEventListener('resize', handleResizeDust);
          cleanups.push(() => window.removeEventListener('resize', handleResizeDust));

          const count = Math.max(36, Math.min(95, Math.floor((window.innerWidth * window.innerHeight) / 14000)));
          const particles = [];
          for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 0.05;
            const vy = -0.04 - Math.random() * 0.1;
            particles.push({
              x: Math.random() * W,
              y: Math.random() * H,
              r: 0.9 + Math.random() * 2.1,
              vx,
              vy,
              baseVx: vx,
              baseVy: vy,
              alpha: 0.22 + Math.random() * 0.4
            });
          }

          let dmx = -9999;
          let dmy = -9999;
          const handleDustMouseMove = (e) => {
            dmx = e.clientX;
            dmy = e.clientY;
          };
          window.addEventListener('mousemove', handleDustMouseMove, { passive: true });
          cleanups.push(() => window.removeEventListener('mousemove', handleDustMouseMove));

          let dustAnimId;
          const dustLoop = () => {
            if (!isMounted) return;
            ctx.clearRect(0, 0, W, H);
            particles.forEach((p) => {
              const dx = p.x - dmx;
              const dy = p.y - dmy;
              const dist2 = dx * dx + dy * dy;
              const radius = 150;
              if (dist2 < radius * radius) {
                const dist = Math.sqrt(dist2) || 1;
                const force = (radius - dist) / radius;
                p.vx += (dx / dist) * force * 0.45;
                p.vy += (dy / dist) * force * 0.45;
              }
              p.vx += (p.baseVx - p.vx) * 0.02;
              p.vy += (p.baseVy - p.vy) * 0.02;
              p.x += p.vx;
              p.y += p.vy;
              if (p.y < -10) {
                p.y = H + 10;
                p.x = Math.random() * W;
              }
              if (p.x < -10) p.x = W + 10;
              if (p.x > W + 10) p.x = -10;
              ctx.beginPath();
              // Crisp light dust particles in dark mode
              ctx.fillStyle = `rgba(225, 233, 242, ${p.alpha * 0.75})`;
              ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
              ctx.fill();
            });
            dustAnimId = requestAnimationFrame(dustLoop);
          };
          dustLoop();
          cleanups.push(() => cancelAnimationFrame(dustAnimId));
        }
      }

      // Geo Shapes Parallax
      const geoField = root.querySelector('#geoField');
      if (geoField) {
        const shapes = geoField.querySelectorAll('.geo-shape');
        if (shapes.length) {
          let nx = 0, ny = 0, cx2 = 0, cy2 = 0;
          let geoAnimId;
          const handleGeoMouseMove = (e) => {
            nx = e.clientX / window.innerWidth - 0.5;
            ny = e.clientY / window.innerHeight - 0.5;
          };
          window.addEventListener('mousemove', handleGeoMouseMove, { passive: true });
          cleanups.push(() => window.removeEventListener('mousemove', handleGeoMouseMove));

          const geoLoop = () => {
            if (!isMounted) return;
            cx2 += (nx - cx2) * 0.05;
            cy2 += (ny - cy2) * 0.05;
            shapes.forEach((s) => {
              const depth = parseFloat(s.dataset.depth) || 0.03;
              const tx = cx2 * depth * 550;
              const ty = cy2 * depth * 550;
              s.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px)`;
            });
            geoAnimId = requestAnimationFrame(geoLoop);
          };
          geoLoop();
          cleanups.push(() => cancelAnimationFrame(geoAnimId));
        }
      }
    } else {
      if (dustCanvas) dustCanvas.style.display = 'none';
      if (cursorRing) cursorRing.style.display = 'none';
      if (cursorDot) cursorDot.style.display = 'none';
    }

    /* 5. Generic Reveal On Scroll (Aggressive with immediate viewport check & scroll fallback) */
    const revealEls = root.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.02, rootMargin: '120px 0px 120px 0px' }
    );

    // Initial check: if already in or near viewport on mount
    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 120) {
        el.classList.add('is-visible');
      } else {
        io.observe(el);
      }
    });

    // Secondary scroll listener fallback
    const handleRevealScroll = () => {
      revealEls.forEach((el) => {
        if (!el.classList.contains('is-visible')) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight + 100) {
            el.classList.add('is-visible');
            try { io.unobserve(el); } catch (e) {}
          }
        }
      });
    };
    window.addEventListener('scroll', handleRevealScroll, { passive: true });

    // Safety timeout to ensure everything visible in first 2 viewports is rendered
    const safetyTimer = setTimeout(() => {
      if (!isMounted) return;
      handleRevealScroll();
    }, 400);

    cleanups.push(() => {
      io.disconnect();
      window.removeEventListener('scroll', handleRevealScroll);
      clearTimeout(safetyTimer);
    });

    /* 6. Mock Report Activation */
    const mockReport = mockReportRef.current;
    if (mockReport) {
      const mrObs = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('active');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      mrObs.observe(mockReport);
      cleanups.push(() => mrObs.disconnect());
    }

    /* 7. Word Cloud Activation */
    const wordCloud = wordCloudRef.current;
    if (wordCloud) {
      const wcObs = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('active');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      wcObs.observe(wordCloud);
      cleanups.push(() => wcObs.disconnect());
    }

    /* 8. Terminal Typewriter */
    const termBody = termBodyRef.current;
    const termEl = terminalRef.current;
    const script = [
      { type: 'term-query', text: 'geointel retrieve --stratigraphy: borehole lithology log & coal seam reserve — Block-IV, subsidiary WCL' },
      { type: 'term-status', text: 'retrieving verified subsurface repository & stratigraphic cross-sections… 94%' },
      { type: 'term-response', text: 'geological synthesis generated in 4.2s · 3 exploration volumes & 12 borehole logs verified' }
    ];

    let typeTimeout;
    const typeLine = (lineIdx, charIdx) => {
      if (!isMounted || !termBody || lineIdx >= script.length) return;
      const line = script[lineIdx];
      let p;
      if (charIdx === 0) {
        p = document.createElement('p');
        p.className = 'term-line ' + line.type;
        termBody.appendChild(p);
      } else {
        p = termBody.lastElementChild;
      }
      if (p) {
        p.textContent = line.text.slice(0, charIdx) + (charIdx < line.text.length ? '▍' : '');
      }
      if (charIdx < line.text.length) {
        typeTimeout = setTimeout(() => typeLine(lineIdx, charIdx + 1), 20 + Math.random() * 26);
      } else {
        typeTimeout = setTimeout(() => typeLine(lineIdx + 1, 0), 480);
      }
    };

    if (termEl && termBody) {
      let typed = false;
      const termObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !typed) {
              typed = true;
              typeLine(0, 0);
              termObs.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );
      termObs.observe(termEl);
      cleanups.push(() => {
        termObs.disconnect();
        clearTimeout(typeTimeout);
      });
    }

    /* 9. Stat Counters */
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const animateCount = (el) => {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const dur = 1800;
      let start = null;
      function step(ts) {
        if (!isMounted) return;
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const eased = easeOutCubic(p);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };

    const statRow = statRowRef.current;
    if (statRow) {
      const statObs = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.querySelectorAll('.stat-value').forEach(animateCount);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      statObs.observe(statRow);
      cleanups.push(() => statObs.disconnect());
    }

    /* 10. GSAP ScrollTrigger */
    if (window.gsap && window.ScrollTrigger) {
      const gsap = window.gsap;
      const ScrollTrigger = window.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const coalTween = gsap.to(root.querySelector('.coal-shapes'), {
        yPercent: -16,
        opacity: 0.4,
        ease: 'none',
        scrollTrigger: {
          trigger: root.querySelector('.hero'),
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      const fill = timelineFillRef.current;
      const track = root.querySelector('#roadmap .timeline');
      let fillTween;
      if (fill && track) {
        fillTween = gsap.to(fill, {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: track,
            start: 'top 65%',
            end: 'bottom 75%',
            scrub: true
          }
        });
      }

      const timelineTriggers = [];
      root.querySelectorAll('.timeline-item').forEach((item) => {
        const st = ScrollTrigger.create({
          trigger: item,
          start: 'top 62%',
          end: 'bottom 45%',
          onEnter: () => item.classList.add('active'),
          onEnterBack: () => item.classList.add('active'),
          onLeaveBack: () => item.classList.remove('active')
        });
        timelineTriggers.push(st);
      });

      cleanups.push(() => {
        coalTween?.kill();
        fillTween?.kill();
        timelineTriggers.forEach((st) => st.kill());
      });
    }

    return () => {
      isMounted = false;
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch (e) {}
      });
      root.classList.remove('has-cursor');
    };
  }, []);

  return (
    <div className="cmpdi-landing" ref={containerRef}>
      <div className="grain" aria-hidden="true" />
      <canvas ref={dustCanvasRef} id="dustCanvas" className="dust-canvas" aria-hidden="true" />
      
      {/* Dynamic Geometric Parallax Background */}
      <div className="geo-field" id="geoField" aria-hidden="true">
        <div className="geo-shape-wrap" style={{ top: '10%', left: '5%', animationDuration: '10s' }}>
          <svg className="geo-shape" data-depth="0.04" viewBox="0 0 60 60" width="56" height="56">
            <circle cx="30" cy="30" r="26" fill="none" stroke="#7C8792" strokeWidth="1" strokeDasharray="4 5" />
          </svg>
        </div>
        <div className="geo-shape-wrap" style={{ top: '66%', left: '89%', animationDuration: '8s', animationDelay: '-2s' }}>
          <svg className="geo-shape" data-depth="0.07" viewBox="0 0 60 60" width="42" height="42">
            <polygon points="30,6 54,50 6,50" fill="none" stroke="#3A7FA8" strokeOpacity="0.6" strokeWidth="1" />
          </svg>
        </div>
        <div className="geo-shape-wrap" style={{ top: '18%', left: '85%', animationDuration: '11s', animationDelay: '-4s' }}>
          <svg className="geo-shape" data-depth="0.055" viewBox="0 0 40 40" width="30" height="30">
            <line x1="20" y1="4" x2="20" y2="36" stroke="#7C8792" strokeWidth="1" />
            <line x1="4" y1="20" x2="36" y2="20" stroke="#7C8792" strokeWidth="1" />
          </svg>
        </div>
        <div className="geo-shape-wrap" style={{ top: '87%', left: '9%', animationDuration: '7.5s', animationDelay: '-1s' }}>
          <svg className="geo-shape" data-depth="0.03" viewBox="0 0 40 20" width="36" height="18">
            <line x1="2" y1="18" x2="38" y2="2" stroke="#3A7FA8" strokeOpacity="0.6" strokeWidth="1" />
          </svg>
        </div>
        <div className="geo-shape-wrap" style={{ top: '42%', left: '3%', animationDuration: '9.5s', animationDelay: '-3s' }}>
          <svg className="geo-shape" data-depth="0.06" viewBox="0 0 40 40" width="26" height="26">
            <circle cx="20" cy="20" r="3" fill="#3A7FA8" fillOpacity="0.75" />
            <circle cx="20" cy="20" r="17" fill="none" stroke="#7C8792" strokeWidth="1" />
          </svg>
        </div>
        <div className="geo-shape-wrap" style={{ top: '32%', left: '95%', animationDuration: '8.5s', animationDelay: '-5s' }}>
          <svg className="geo-shape" data-depth="0.05" viewBox="0 0 40 40" width="24" height="24">
            <rect x="8" y="8" width="24" height="24" fill="none" stroke="#7C8792" strokeWidth="1" transform="rotate(15 20 20)" />
          </svg>
        </div>
        <div className="geo-shape-wrap" style={{ top: '78%', left: '48%', animationDuration: '10.5s', animationDelay: '-6s' }}>
          <svg className="geo-shape" data-depth="0.025" viewBox="0 0 60 20" width="40" height="14">
            <line x1="2" y1="10" x2="58" y2="10" stroke="#7C8792" strokeWidth="1" strokeDasharray="2 6" />
          </svg>
        </div>
      </div>

      <div ref={cursorRingRef} className="cmpdi-cursor-ring" id="cursorRing" aria-hidden="true" />
      <div ref={cursorDotRef} className="cmpdi-cursor-dot" id="cursorDot" aria-hidden="true" />

      {/* Navigation Header */}
      <header className="nav" id="nav" ref={navRef}>
        <div className="nav-mark">
          <span className="nav-mark-brand">GeoIntel Core</span>
          <span className="nav-mark-dim">/</span>
          <span>CMPDI Geological Platform</span>
        </div>
        <div className="nav-actions">
          <span className="nav-ticker mono" id="navTicker" ref={navTickerRef} aria-hidden="true"></span>
          <button 
            onClick={() => handleLaunch('dashboard')}
            className="nav-btn-app"
            title="Launch Geological Workspace"
          >
            <span>Launch Geo-Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="hero" id="top">
          <div className="hero-bg" aria-hidden="true">
            <div className="hero-grid-overlay" />
            <div className="coal-shapes">
              <span className="coal c1" />
              <span className="coal c2" />
              <span className="coal c3" />
            </div>
            <div className="data-nodes" id="dataNodes">
              {[
                [8, 20], [18, 55], [27, 12], [38, 68],
                [47, 30], [58, 50], [66, 15], [74, 72],
                [83, 38], [91, 58], [15, 80], [54, 84]
              ].map((pos, i) => (
                <span
                  key={i}
                  className="node"
                  style={{
                    left: `${pos[0]}%`,
                    top: `${pos[1]}%`,
                    animationDelay: `${i * 0.45}s`
                  }}
                />
              ))}
            </div>
          </div>

          <div className="hero-content">
            <p className="eyebrow">GeoIntel Core · CMPDI / CIL · Ministry of Coal</p>
            <h1 className="hero-title">
              Advancing subsurface<br />geological intelligence.
            </h1>
            <p className="hero-sub">
              GeoIntel Core is an enterprise geological AI platform for CMPDI and CIL subsidiaries — transforming borehole lithology logs, drill core stratigraphy, geospatial shapefiles, and historical exploration records into rapid, verifiable geological synthesis for the Ministry of Coal.
            </p>
            <div className="hero-actions">
              <button 
                onClick={() => handleLaunch('dashboard')} 
                className="btn btn-solid cursor-pointer"
              >
                <span>Access Geological Platform</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
              <button 
                onClick={onOpenArchitecture || (() => window.location.hash = '#roadmap')} 
                className="btn btn-outline cursor-pointer"
                title="View Technical System Architecture"
              >
                <span>System Architecture</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 opacity-60" />
              </button>
            </div>
          </div>

          <div className="hero-float-card">
            <span className="hfc-label">Subsurface Extraction Precision</span>
            <span className="hfc-value" id="hfcValue" ref={hfcValueRef}>
              99.2%
            </span>
            <svg className="hfc-spark" viewBox="0 0 160 40" preserveAspectRatio="none" aria-hidden="true">
              <polyline
                points="0,30 20,25 40,28 60,14 80,18 100,8 120,12 140,4 160,6"
                fill="none"
                stroke="#E5A84B"
                strokeWidth="1.5"
                opacity=".85"
              />
            </svg>
          </div>

          <div className="scroll-cue">
            <span />Scroll
          </div>
        </section>

        {/* 01 · THE SUBSURFACE INFORMATION BOTTLENECK */}
        <section className="section" id="challenge">
          <div className="section-head">
            <p className="eyebrow">01 · Subsurface Information Bottleneck</p>
            <h2 className="reveal" data-anim="up">
              Exploration reporting remains bound to unindexed geological knowledge and manual assembly.
            </h2>
            <p className="section-lede reveal" data-anim="up" style={{ '--i': 1 }}>
              Statutory inquiries, resource evaluations, and parliamentary queries require manually extracting data from legacy borehole folios, scanned lithology sheets, and disparate regional archives across individual subsidiaries.
            </p>
          </div>
          <div className="challenge-grid">
            <article className="spec-card reveal" data-anim="clip" style={{ '--i': 0 }}>
              <span className="spec-mark" />
              <h3>Siloed geological knowledge</h3>
              <p>Critical exploration assessments depend on senior domain geologists possessing unindexed institutional memory of archive locations.</p>
              <span className="spec-tag">Domain Dependency · Critical Senior Geologist Reliance</span>
            </article>
            <article className="spec-card reveal" data-anim="clip" style={{ '--i': 1 }}>
              <span className="spec-mark" />
              <h3>Prolonged retrieval latency</h3>
              <p>Retrieving multi-borehole lithology logs and legacy core samples into unified dossiers consumes days of manual record tracing.</p>
              <span className="spec-tag">Retrieval Latency · 3–5 Business Days per Dossier</span>
            </article>
            <article className="spec-card reveal" data-anim="clip" style={{ '--i': 2 }}>
              <span className="spec-mark" />
              <h3>Stratigraphic transcription risk</h3>
              <p>Manual transcription of borehole depths, seam thicknesses, and coal grades introduces discrepancies into statutory submissions.</p>
              <span className="spec-tag">Audit Risk · Stratigraphic Variance & Verification Overhead</span>
            </article>
            <article className="spec-card reveal" data-anim="clip" style={{ '--i': 3 }}>
              <span className="spec-mark" />
              <h3>Entombed geological archives</h3>
              <p>Decades of high-value drill logs and mineralogical surveys remain entombed in legacy raster scans, inaccessible to spatial queries.</p>
              <span className="spec-tag">Dormant Subsurface Data · 128,400+ Unindexed Records</span>
            </article>
          </div>
        </section>

        {/* 02 · SUBSURFACE INTELLIGENCE SUITE */}
        <section className="section alt" id="platform">
          <div className="section-head">
            <p className="eyebrow">02 · Subsurface Intelligence Suite</p>
            <h2 className="reveal" data-anim="up">
              Three integrated engines, one unified geological pipeline.
            </h2>
            <p className="section-lede reveal" data-anim="up" style={{ '--i': 1 }}>
              Borehole logs, geophysical surveys, and mine plan matrices ingest directly into multimodal AI. Verifiable, audit-ready exploration reports emerge with full source provenance.
            </p>
          </div>
          <div className="bento">
            <article className="bento-box bento-large reveal" data-anim="scale">
              <div className="flex items-center justify-between mb-1">
                <h3>Automated Geological Report &amp; Dossier Synthesis</h3>
                <button 
                  onClick={() => handleLaunch('reports')} 
                  className="text-xs text-[#E5A84B] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Launch Dossier Builder</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <p>
                Borehole lithology strata, proximate analysis tables, and reserve estimations are parsed, validated against statutory norms, and assembled into structured dossiers automatically.
              </p>
              <div className="mock-report" id="mockReport" ref={mockReportRef}>
                <div className="mock-doc" aria-hidden="true">
                  <span className="mock-doc-title">CMPDI_BOREHOLE_STRATIGRAPHY_WCL_BLOCK_IV.pdf</span>
                  <div className="doc-line" style={{ width: '88%' }} />
                  <div className="doc-line" style={{ width: '64%' }} />
                  <div className="doc-line" style={{ width: '79%' }} />
                  <div className="doc-line" style={{ width: '52%' }} />
                  <div className="doc-line" style={{ width: '71%' }} />
                  <div className="doc-line" style={{ width: '40%' }} />
                  <div className="scan-line" />
                </div>
                <svg className="mock-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mock-table" aria-hidden="true">
                  <div className="mock-row head">
                    <span>Stratigraphic Seam</span>
                    <span>Thickness</span>
                    <span>Proved Reserve</span>
                    <span>Validation</span>
                  </div>
                  <div className="mock-row">
                    <span>Seam-XIV (Bottom)</span>
                    <span>3.82 m</span>
                    <span>42.6 Mt</span>
                    <span className="status-ok">Verified</span>
                  </div>
                  <div className="mock-row">
                    <span>Seam-IX (Middle)</span>
                    <span>2.15 m</span>
                    <span>18.9 Mt</span>
                    <span className="status-ok">Verified</span>
                  </div>
                  <div className="mock-row">
                    <span>Seam-XXII (Top)</span>
                    <span>4.40 m</span>
                    <span>55.2 Mt</span>
                    <span className="status-review">Strata Review</span>
                  </div>
                  <div className="mock-row">
                    <span>Seam-VII (Basal)</span>
                    <span>1.90 m</span>
                    <span>11.4 Mt</span>
                    <span className="status-ok">Verified</span>
                  </div>
                </div>
              </div>
            </article>

            <article className="bento-box reveal" data-anim="scale" style={{ '--i': 1 }}>
              <div className="flex items-center justify-between mb-1">
                <h3>Stratigraphic taxonomy &amp; thematic extraction</h3>
                <button 
                  onClick={() => handleLaunch('documents')} 
                  className="text-xs text-[#E5A84B] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Geological Archive</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <p>Incoming exploration folios are autonomously indexed for geological entities, lithological horizons, and chemical gradings.</p>
              <div className="word-cloud" id="wordCloud" ref={wordCloudRef} aria-hidden="true">
                <span className="wc-term wc-lg" style={{ '--o': 0.95 }}>Stratigraphic correlation</span>
                <span className="wc-term wc-sm" style={{ '--o': 0.55 }}>Borehole lithology</span>
                <span className="wc-term wc-md" style={{ '--o': 0.8 }}>UNFC Proved Reserves</span>
                <span className="wc-term wc-sm" style={{ '--o': 0.5 }}>Block-IV Strata</span>
                <span className="wc-term wc-lg" style={{ '--o': 0.9 }}>Overburden ratio (OBR)</span>
                <span className="wc-term wc-md" style={{ '--o': 0.75 }}>Proximate ash analysis</span>
                <span className="wc-term wc-sm" style={{ '--o': 0.5 }}>Gross calorific value</span>
                <span className="wc-term wc-md" style={{ '--o': 0.7 }}>Geophysical well log</span>
              </div>
            </article>

            <article className="bento-box reveal" data-anim="scale" style={{ '--i': 2 }}>
              <div className="flex items-center justify-between mb-1">
                <h3>Semantic vector retrieval &amp; subsurface synthesis</h3>
                <button 
                  onClick={() => handleLaunch('chat')} 
                  className="text-xs text-[#E5A84B] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Launch Retrieval</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <p>Formulate natural language exploration queries to perform neural vector retrieval across decades of subsurface drill logs, seam analyses, and verified regional dossiers.</p>
              <div className="terminal" id="terminal" ref={terminalRef}>
                <div className="term-bar" aria-hidden="true">
                  <span /><span /><span />
                </div>
                <div className="term-body" id="termBody" ref={termBodyRef} aria-live="polite" />
              </div>
            </article>
          </div>
        </section>

        {/* 03 · THE IMPACT */}
        <section className="section" id="impact">
          <div className="section-head">
            <p className="eyebrow">03 · Operational &amp; Exploration Impact</p>
            <h2 className="reveal" data-anim="up">
              Quantifiable operational value in mining intelligence.
            </h2>
            <p className="impact-note reveal" data-anim="up" style={{ '--i': 1 }}>
              Target benchmarks established through geological requirement matrices and verified CMPDI field pilots.
            </p>
          </div>
          <div className="stat-row" ref={statRowRef}>
            <div className="stat reveal" data-anim="fade">
              <span className="stat-value" data-target="85" data-suffix="%">0%</span>
              <span className="stat-label">Reduction in geological dossier compilation time</span>
            </div>
            <div className="stat reveal" data-anim="fade" style={{ '--i': 1 }}>
              <span className="stat-value" data-target="99" data-suffix="%">0%</span>
              <span className="stat-label">Precision in tabular lithology and reserve extraction</span>
            </div>
            <div className="stat reveal" data-anim="fade" style={{ '--i': 2 }}>
              <span className="stat-value" data-target="90" data-suffix="%">0%</span>
              <span className="stat-label">Of routine statutory and ministerial reporting automated</span>
            </div>
            <div className="stat reveal" data-anim="fade" style={{ '--i': 3 }}>
              <span className="stat-value" data-target="100" data-suffix="%">0%</span>
              <span className="stat-label">Traceability with direct citations to original borehole scans</span>
            </div>
          </div>
        </section>

        {/* 04 · THE PATH / ROADMAP */}
        <section className="section alt" id="roadmap">
          <div className="section-head">
            <p className="eyebrow">04 · Deployment Roadmap</p>
            <h2 className="reveal" data-anim="up">
              Structured operational deployment across exploration divisions.
            </h2>
            <p className="section-lede reveal" data-anim="up" style={{ '--i': 1 }}>
              Each implementation phase is validated against statutory geological documentation and CIL subsidiary standards.
            </p>
          </div>
          <div className="timeline">
            <div className="timeline-track">
              <div className="timeline-fill" id="timelineFill" ref={timelineFillRef} />
            </div>
            <ol className="timeline-list">
              <li className="timeline-item reveal" data-anim="up" style={{ '--i': 0 }}>
                <span className="ti-node" />
                <span className="ti-num">Phase 1</span>
                <h3>Stratigraphic schema &amp; requirement mapping</h3>
                <p>Codify statutory reporting formats, borehole data schemas, and multi-subsidiary exploration workflows.</p>
              </li>
              <li className="timeline-item reveal" data-anim="up" style={{ '--i': 1 }}>
                <span className="ti-node" />
                <span className="ti-num">Phase 2</span>
                <h3>Geological data digitisation &amp; vector indexing</h3>
                <p>Convert legacy drill core logs, raster seam folios, and chemical assay sheets into high-dimensional vector embeddings.</p>
              </li>
              <li className="timeline-item reveal" data-anim="up" style={{ '--i': 2 }}>
                <span className="ti-node" />
                <span className="ti-num">Phase 3</span>
                <h3>Geological AI engine deployment</h3>
                <p>Deploy the automated dossier synthesis engine, stratigraphic semantic tagger, and neural retrieval pipelines.</p>
              </li>
              <li className="timeline-item reveal" data-anim="up" style={{ '--i': 3 }}>
                <span className="ti-node" />
                <span className="ti-num">Phase 4</span>
                <h3>Ground-truth benchmarking &amp; verification</h3>
                <p>Validate synthesized reserve calculations and seam correlations against verified historical CMPDI exploration records.</p>
              </li>
              <li className="timeline-item reveal" data-anim="up" style={{ '--i': 4 }}>
                <span className="ti-node" />
                <span className="ti-num">Phase 5</span>
                <h3>CIL subsidiary &amp; field command integration</h3>
                <p>Connect the platform into operational reporting workflows across ECL, BCCL, CCL, WCL, SECL, NCL, and MCL.</p>
              </li>
              <li className="timeline-item reveal" data-anim="up" style={{ '--i': 5 }}>
                <span className="ti-node" />
                <span className="ti-num">Phase 6</span>
                <h3>Domain fine-tuning &amp; continuous learning</h3>
                <p>Empower exploration geologists with retrieval tools while continuously adapting domain models on fresh drill campaigns.</p>
              </li>
            </ol>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer" id="contact">
        <h2 className="footer-cta reveal" data-anim="up">
          Empower geological discovery with GeoIntel Core.
        </h2>
        <p className="footer-sub reveal" data-anim="up" style={{ '--i': 1 }}>
          A unified, verifiable geological knowledge platform for CMPDI and all Coal India subsidiaries — accelerating resource planning, statutory compliance, and data-driven mineral governance for the Ministry of Coal.
        </p>
        <div className="footer-actions">
          <button 
            onClick={() => handleLaunch('dashboard')}
            className="btn btn-solid cursor-pointer"
          >
            <span>Access Platform</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
        <nav className="footer-links">
          <a href="#top">Platform Overview</a>
          <button 
            onClick={onOpenArchitecture}
            className="footer-nav-btn cursor-pointer"
          >
            System Architecture
          </button>
          <button 
            onClick={() => handleLaunch('chat')} 
            className="footer-nav-btn"
          >
            Geological Retrieval Assistant
          </button>
        </nav>
        <p className="footer-fine">
          GeoIntel Core · Subsurface Geological Intelligence Platform for CMPDI / CIL subsidiaries · Ministry of Coal
        </p>
      </footer>
    </div>
  );
}
