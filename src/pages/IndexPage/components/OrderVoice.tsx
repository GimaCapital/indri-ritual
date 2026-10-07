interface Props {
  voice: string;
}

export function OrderVoice({ voice }: Props) {
  return (
    <p style={{
      fontSize: '10px',
      color: '#444444',
      letterSpacing: '4px',
      textTransform: 'uppercase',
      textAlign: 'center',
      marginBottom: '20px',
      minHeight: '14px',
    }}>
      {voice}
    </p>
  );
}