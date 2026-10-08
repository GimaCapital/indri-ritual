import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  isStaying: boolean;
  eyesOpen: number;
  onTap: () => void;
}

// ─── Config ────────────────────────────────────────────────────────────────
// PNG is transparent (confirmed via browser checkerboard).
// No mix-blend-mode needed.
const SIGIL_SRC = '/indri.png';
const ENTRANCE_DURATION_MS = 2000;
const EXIT_DURATION_MS = 900;

// ───────────────────────────────────────────────────────────────────────────

export function Sigil({ isStaying, eyesOpen, onTap }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [acknowledgeBlink, setAcknowledgeBlink] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [scale, setScale] = useState(0);
  const [exiting, setExiting] = useState(false);

  // ─── Preload the image ──────────────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.src = SIGIL_SRC;
    img.onload = () => setImageReady(true);
    img.onerror = () => setImageReady(true);
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  // ─── Entrance: 0 → 1 over 2s once the image is ready ────────────────────
  useEffect(() => {
    if (!imageReady) return;
    // One frame of delay so the browser paints scale(0) before animating up.
    const id = window.setTimeout(() => setScale(1), 32);
    return () => window.clearTimeout(id);
  }, [imageReady]);

  // ─── Exit: 1 → 0 when the app is closing ────────────────────────────────
  useEffect(() => {
    const handleExit = () => {
      setExiting((prev) => {
        if (!prev) setScale(0);
        return true;
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') handleExit();
    };
    const onPageHide = () => handleExit();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  // ─── Gaze tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (clientX - cx) / (rect.width / 2);
      const dy = (clientY - cy) / (rect.height / 2);
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      setGaze({ x: clamp(dx), y: clamp(dy) });
    };

    const onMouse = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handleMove(t.clientX, t.clientY);
    };

    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchstart', onTouch);
    };
  }, []);

  // ─── First-hover acknowledgment: single blink, once per session ─────────
  useEffect(() => {
    if (hasAcknowledged) return;
    const el = containerRef.current;
    if (!el) return;

    const trigger = () => {
      setHasAcknowledged(true);
      setAcknowledgeBlink(true);
      window.setTimeout(() => setAcknowledgeBlink(false), 900);
    };

    el.addEventListener('mouseenter', trigger);
    el.addEventListener('touchstart', trigger);
    return () => {
      el.removeEventListener('mouseenter', trigger);
      el.removeEventListener('touchstart', trigger);
    };
  }, [hasAcknowledged]);

  // ─── Derived values ─────────────────────────────────────────────────────
  const effectiveGaze = isStaying ? { x: 0, y: 0 } : gaze;

  const pupilOffsetX = effectiveGaze.x * 4;
  const pupilOffsetY = effectiveGaze.y * 3;
  const sigilShiftX = effectiveGaze.x * 2;
  const sigilShiftY = effectiveGaze.y * 2;

  const lidAnimation = useMemo(() => {
    if (isStaying) return 'none';
    if (acknowledgeBlink) return 'acknowledge 0.6s ease-out';
    return 'blinkTwice 6s ease-in-out infinite';
  }, [isStaying, acknowledgeBlink]);

  const stayingScale = isStaying ? 1 + eyesOpen * 0.08 : 1;
  const imageScale = stayingScale;

  // Wrapper transition: slow cinematic entrance, faster exit
  const wrapperTransition = exiting
    ? `transform ${EXIT_DURATION_MS}ms cubic-bezier(0.4, 0, 1, 1), opacity ${EXIT_DURATION_MS}ms cubic-bezier(0.4, 0, 1, 1)`
    : `transform ${ENTRANCE_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${ENTRANCE_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '230px',
        height: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        transform: `scale(${scale})`,
        opacity: scale,
        transition: wrapperTransition,
        transformOrigin: 'center center',
        willChange: 'transform, opacity',
      }}
    >
      <style>{`
        @keyframes blinkTwice {
          0%, 60%, 100% { transform: scaleY(1); }
          63%, 67%      { transform: scaleY(0.05); }
          70%, 74%      { transform: scaleY(0.05); }
        }
        @keyframes acknowledge {
          0%    { transform: scaleY(1); }
          30%   { transform: scaleY(0.05); }
          55%   { transform: scaleY(0.05); }
          100%  { transform: scaleY(1); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.02); }
        }
        @keyframes humPulseStrong {
          0%   { transform: translate(-50%, -50%) scale(0.75); opacity: 0; }
          15%  { opacity: 0.7; }
          70%  { opacity: 0.15; }
          100% { transform: translate(-50%, -50%) scale(1.45); opacity: 0; }
        }
      `}</style>

      {/* Hum ring — only while staying */}
      {isStaying && !exiting && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '230px',
            height: '230px',
            borderRadius: '50%',
            border: '1px solid rgba(160, 160, 255, 0.8)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'humPulseStrong 2s ease-out infinite',
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* Aura glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${400 + eyesOpen * 2000}px`,
          height: `${400 + eyesOpen * 2000}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(160, 160, 255, ${
            0.3 + eyesOpen * 1.0
          }) 0%, rgba(120, 120, 220, ${
            0.15 + eyesOpen * 0.7
          }) 25%, rgba(80, 80, 180, ${
            0.05 + eyesOpen * 0.4
          }) 50%, transparent 75%)`,
          opacity: isStaying ? 1 : 0.5,
          transition: 'all 1.5s ease-in-out',
          pointerEvents: 'none',
          zIndex: 1,
          filter: 'blur(40px)',
          willChange: 'width, height, opacity',
        }}
      />

      {/* Sigil image — transparent PNG, no blend mode */}
      <img
        src={SIGIL_SRC}
        alt=""
        onClick={onTap}
        draggable={false}
        style={{
          width: '230px',
          height: '180px',
          objectFit: 'contain',
          transform: `translate(${sigilShiftX}px, ${sigilShiftY}px) scale(${imageScale})`,
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: isStaying ? 'none' : 'breathe 5s ease-in-out infinite',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 2,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitUserDrag: 'none',
          willChange: 'transform',
        } as React.CSSProperties}
      />

      {/* LEFT PUPIL */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: `calc(49% + ${pupilOffsetY}px)`,
          left: `calc(40.5% + ${pupilOffsetX}px)`,
          width: '4%',
          height: '5%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(160,160,160,0.55) 0%, rgba(120,120,120,0.25) 50%, transparent 80%)',
          transform: 'translate(-50%, -50%)',
          transition: 'top 0.4s ease-out, left 0.4s ease-out, opacity 0.5s ease',
          opacity: isStaying ? 0.85 : 0.7,
          pointerEvents: 'none',
          zIndex: 3,
          filter: 'blur(1px)',
        }}
      />

      {/* RIGHT PUPIL */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: `calc(49% + ${pupilOffsetY}px)`,
          left: `calc(59.5% + ${pupilOffsetX}px)`,
          width: '4%',
          height: '5%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(160,160,160,0.55) 0%, rgba(120,120,120,0.25) 50%, transparent 80%)',
          transform: 'translate(-50%, -50%)',
          transition: 'top 0.4s ease-out, left 0.4s ease-out, opacity 0.5s ease',
          opacity: isStaying ? 0.85 : 0.7,
          pointerEvents: 'none',
          zIndex: 3,
          filter: 'blur(1px)',
        }}
      />

      {/* LEFT EYE LID */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '42%',
          left: '33.5%',
          width: '14%',
          height: '15%',
          background:
            'radial-gradient(ellipse at center, #0a0a0a 0%, #1a1a1a 55%, #252525 85%, #1f1f1f 100%)',
          borderRadius: '50% 50% 0 0',
          transformOrigin: 'top center',
          transform: isStaying ? 'scaleY(0)' : 'scaleY(1)',
          transition: isStaying
            ? 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: lidAnimation,
          pointerEvents: 'none',
          zIndex: 4,
          willChange: 'transform',
        }}
      />

      {/* RIGHT EYE LID */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '42%',
          right: '33.5%',
          width: '14%',
          height: '15%',
          background:
            'radial-gradient(ellipse at center, #0a0a0a 0%, #1a1a1a 55%, #252525 85%, #1f1f1f 100%)',
          borderRadius: '50% 50% 0 0',
          transformOrigin: 'top center',
          transform: isStaying ? 'scaleY(0)' : 'scaleY(1)',
          transition: isStaying
            ? 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: lidAnimation,
          pointerEvents: 'none',
          zIndex: 4,
          willChange: 'transform',
        }}
      />
    </div>
  );
}