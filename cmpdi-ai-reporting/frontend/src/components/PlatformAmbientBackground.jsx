import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';

export default function PlatformAmbientBackground({ isSidebarCollapsed }) {
  const canvasRef = useRef(null);
  const geoFieldRef = useRef(null);
  const { theme } = useAppContext();

  useEffect(() => {
    let isMounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Number of subtle dust particles concentrated mostly around the outer perimeter and sidebar
    const count = Math.max(36, Math.min(80, Math.floor((W * H) / 18000)));
    const particles = [];
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 0.05;
      const vy = -0.05 - Math.random() * 0.1;
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.8 + Math.random() * 1.8,
        vx,
        vy,
        baseVx: vx,
        baseVy: vy,
        alpha: 0.18 + Math.random() * 0.32
      });
    }

    let dmx = -9999;
    let dmy = -9999;
    const handleMouseMove = (e) => {
      dmx = e.clientX;
      dmy = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let animId;
    const isDark = document.documentElement.classList.contains('dark') || theme === 'dark';
    const rgbBase = isDark ? '210, 222, 235' : '45, 55, 65';

    const dustLoop = () => {
      if (!isMounted) return;
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        const dx = p.x - dmx;
        const dy = p.y - dmy;
        const dist2 = dx * dx + dy * dy;
        const radius = 130;
        if (dist2 < radius * radius) {
          const dist = Math.sqrt(dist2) || 1;
          const force = (radius - dist) / radius;
          p.vx += (dx / dist) * force * 0.4;
          p.vy += (dy / dist) * force * 0.4;
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
        ctx.fillStyle = `rgba(${rgbBase}, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(dustLoop);
    };
    dustLoop();

    // Subtle magnetic parallax on sidebar geometric elements
    const geoField = geoFieldRef.current;
    let geoAnimId;
    if (geoField) {
      const shapes = geoField.querySelectorAll('.geo-ambient-shape');
      if (shapes.length) {
        let nx = 0, ny = 0, cx2 = 0, cy2 = 0;
        const handleGeoMove = (e) => {
          nx = e.clientX / window.innerWidth - 0.5;
          ny = e.clientY / window.innerHeight - 0.5;
        };
        window.addEventListener('mousemove', handleGeoMove, { passive: true });

        const geoLoop = () => {
          if (!isMounted) return;
          cx2 += (nx - cx2) * 0.05;
          cy2 += (ny - cy2) * 0.05;
          shapes.forEach((s) => {
            const depth = parseFloat(s.dataset.depth) || 0.03;
            const tx = cx2 * depth * 400;
            const ty = cy2 * depth * 400;
            s.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`;
          });
          geoAnimId = requestAnimationFrame(geoLoop);
        };
        geoLoop();
      }
    }

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      if (geoAnimId) cancelAnimationFrame(geoAnimId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [theme]);

  const sidebarWidth = isSidebarCollapsed ? 68 : 255;

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* Interactive mineral dust particles */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Floating geometric shapes positioned in the sidebar territory and outer margins */}
      <div ref={geoFieldRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Shape 1: Subtle dashed circle behind sidebar top */}
        <div 
          className="absolute geo-ambient-shape transition-all duration-300"
          data-depth="0.04"
          style={{ 
            top: '8%', 
            left: `${sidebarWidth * 0.28}px`,
            opacity: 0.45,
            animation: 'ambientFloat1 11s ease-in-out infinite' 
          }}
        >
          <svg viewBox="0 0 50 50" width="42" height="42">
            <circle cx="25" cy="25" r="22" fill="none" stroke="#7C8792" strokeWidth="1" strokeDasharray="3 4" />
          </svg>
        </div>

        {/* Shape 2: Crisp angled cross line near middle sidebar */}
        <div 
          className="absolute geo-ambient-shape transition-all duration-300"
          data-depth="0.06"
          style={{ 
            top: '48%', 
            left: `${sidebarWidth * 0.45}px`,
            opacity: 0.4,
            animation: 'ambientFloat2 13s ease-in-out infinite' 
          }}
        >
          <svg viewBox="0 0 32 32" width="26" height="26">
            <line x1="16" y1="4" x2="16" y2="28" stroke="#7C8792" strokeWidth="1" />
            <line x1="4" y1="16" x2="28" y2="16" stroke="#7C8792" strokeWidth="1" />
          </svg>
        </div>

        {/* Shape 3: Amber polygon triangle at lower sidebar edge */}
        <div 
          className="absolute geo-ambient-shape transition-all duration-300"
          data-depth="0.05"
          style={{ 
            top: '78%', 
            left: `${sidebarWidth * 0.2}px`,
            opacity: 0.35,
            animation: 'ambientFloat1 10s ease-in-out infinite' 
          }}
        >
          <svg viewBox="0 0 40 40" width="30" height="30">
            <polygon points="20,6 36,34 4,34" fill="none" stroke="#C98A2B" strokeWidth="1" />
          </svg>
        </div>

        {/* Shape 4: Subtle rotated box in bottom outer perimeter */}
        <div 
          className="absolute geo-ambient-shape"
          data-depth="0.03"
          style={{ 
            bottom: '12px', 
            left: `${sidebarWidth + 40}px`,
            opacity: 0.25,
            animation: 'ambientFloat2 12s ease-in-out infinite' 
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <rect x="4" y="4" width="16" height="16" fill="none" stroke="#7C8792" strokeWidth="1" transform="rotate(25 12 12)" />
          </svg>
        </div>

        {/* Shape 5: Thin dashed accent line along the top outer margin */}
        <div 
          className="absolute geo-ambient-shape"
          data-depth="0.02"
          style={{ 
            top: '6px', 
            right: '18%',
            opacity: 0.25,
            animation: 'ambientFloat1 14s ease-in-out infinite' 
          }}
        >
          <svg viewBox="0 0 60 10" width="50" height="10">
            <line x1="2" y1="5" x2="58" y2="5" stroke="#7C8792" strokeWidth="1" strokeDasharray="2 5" />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes ambientFloat1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes ambientFloat2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(8px) rotate(-4deg); }
        }
      `}</style>
    </div>
  );
}
