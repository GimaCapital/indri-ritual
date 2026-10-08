import { useEffect, useRef, useState } from 'react';

interface Props {
  isStaying: boolean;
  eyesOpen: number;
  onTap: () => void;
}

export function Sigil({ isStaying, eyesOpen, onTap }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [acknowledgeBlink, setAcknowledgeBlink] = useState(false);

  // Track pointer across the whole window, compute a normalized -1..1 vector
  // relative to the sigil's center.
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

    window.addEventListener('mousemove', onMouse);
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchstart', onTouch);
    };
  }, []);

  // First-hover acknowledgment: blink once when the pointer enters the sigil
  useEffect(() => {
    if (hasAcknowledged) return;
    const el = containerRef.current;
    if (!el) return;

    const triggerAcknowledge = () => {
      if (hasAcknowledged) return;
      setHasAcknowledged(true);
      setAcknowledgeBlink(true);
      setTimeout(() => setAcknowledgeBlink(false), 900);
    };

    const onEnter = () => triggerAcknowledge();
    const onTouchStart = () => triggerAcknowledge();

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('touchstart', onTouchStart);

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('touchstart', onTouchStart);
    };
  }, [hasAcknowledged]);

  // When staying, eyes lock forward (pupils center, gaze at rest)
  const effectiveGaze = isStaying ? { x: 0, y: 0 } : gaze;

  const pupilOffsetX = effectiveGaze.x * 6;
  const pupilOffsetY = effectiveGaze.y * 4;
  const sigilShiftX = effectiveGaze.x * 3;
  const sigilShiftY = effectiveGaze.y * 3;

  // Lid animation priority
  const lidAnimation = isStaying
    ? 'none'
    : acknowledgeBlink
      ? 'acknowledge 0.6s ease-out'
      : 'blinkTwice 6s ease-in-out infinite';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '420px',
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        margin: '0 auto',
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
          0% {
            transform: translate(-50%, -50%) scale(0.75);
            opacity: 0;
          }
          15% {
            opacity: 0.7;
          }
          70% {
            opacity: 0.15;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.45);
            opacity: 0;
          }
        }
      `}</style>

      {/* Hum pulse ring — only while staying */}
      {isStaying && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            border: '1px solid rgba(160, 160, 255, 0.8)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'humPulseStrong 2s ease-out infinite',
          }}
        />
      )}

      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${500 + eyesOpen * 2500}px`,
          height: `${500 + eyesOpen * 2500}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(160, 160, 255, ${0.3 + eyesOpen * 1.0}) 0%, rgba(120, 120, 220, ${0.15 + eyesOpen * 0.7}) 25%, rgba(80, 80, 180, ${0.05 + eyesOpen * 0.4}) 50%, transparent 75%)`,
          opacity: isStaying ? 1 : 0.5,
          transition: 'all 1.5s ease-in-out',
          pointerEvents: 'none',
          zIndex: 1,
          filter: 'blur(50px)',
        }}
      />

      {/* Sigil image */}
      <img
        src="/indri.jpg"
        alt=""
        onClick={onTap}
        draggable={false}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: `translate(${sigilShiftX}px, ${sigilShiftY}px) scale(${
            isStaying ? 1 + eyesOpen * 0.08 : 1
          })`,
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: isStaying ? 'none' : 'breathe 5s ease-in-out infinite',
          cursor: 'pointer',
          zIndex: 2,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitUserDrag: 'none',
        } as React.CSSProperties}
      />

      {/* LEFT PUPIL */}
      <div
        style={{
          position: 'absolute',
          top: `calc(49% + ${pupilOffsetY}px)`,
          left: `calc(40.5% + ${pupilOffsetX}px)`,
          width: '4%',
          height: '4%',
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
        style={{
          position: 'absolute',
          top: `calc(49% + ${pupilOffsetY}px)`,
          left: `calc(59.5% + ${pupilOffsetX}px)`,
          width: '4%',
          height: '4%',
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
        style={{
          position: 'absolute',
          top: '42%',
          left: '33.5%',
          width: '14%',
          height: '14%',
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
        }}
      />

      {/* RIGHT EYE LID */}
      <div
        style={{
          position: 'absolute',
          top: '42%',
          right: '33.5%',
          width: '14%',
          height: '14%',
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
        }}
      />
    </div>
  );
}