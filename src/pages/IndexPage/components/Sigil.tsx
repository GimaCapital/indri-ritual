interface Props {
  isStaying: boolean;
  eyesOpen: number;
  onTap: () => void;
}

export function Sigil({ isStaying, eyesOpen, onTap }: Props) {
  return (
    <div style={{
      position: 'relative',
      width: '230px',
      height: '180px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${400 + eyesOpen * 2000}px`,
        height: `${400 + eyesOpen * 2000}px`,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(160, 160, 255, ${0.3 + eyesOpen * 1.0}) 0%, rgba(120, 120, 220, ${0.15 + eyesOpen * 0.7}) 25%, rgba(80, 80, 180, ${0.05 + eyesOpen * 0.4}) 50%, transparent 75%)`,
        opacity: isStaying ? 1 : 0.5,
        transition: 'all 1.5s ease-in-out',
        pointerEvents: 'none',
        zIndex: 1,
        filter: 'blur(40px)',
      }} />

      <img
        src="/indri.jpg"
        alt=""
        onClick={onTap}
        style={{
          width: '230px',
          height: '180px',
          objectFit: 'contain',
          transform: isStaying ? `scale(${1 + eyesOpen * 0.08})` : 'scale(1)',
          transition: 'transform 1.2s ease-in-out',
          position: 'relative',
          zIndex: 2,
          cursor: 'pointer',
        }}
      />
    </div>
  );
}