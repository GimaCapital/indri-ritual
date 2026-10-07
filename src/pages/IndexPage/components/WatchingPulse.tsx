interface Props {
  message: string;
}

export function WatchingPulse({ message }: Props) {
  return (
    <p style={{
      marginTop: '32px',
      fontSize: '9px',
      color: '#333333',
      letterSpacing: '3px',
      textTransform: 'uppercase',
      textAlign: 'center',
      minHeight: '12px',
    }}>
      {message}
    </p>
  );
}