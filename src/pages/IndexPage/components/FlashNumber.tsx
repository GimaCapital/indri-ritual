interface Props {
  number: string | null;
}

export function FlashNumber({ number }: Props) {
  if (!number) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '64px',
      color: '#ffffff',
      fontWeight: 'bold',
      letterSpacing: '10px',
      zIndex: 10,
      pointerEvents: 'none',
      textShadow: '0 0 40px rgba(160, 160, 255, 0.8)',
    }}>
      {number}
    </div>
  );
}