import { TonConnectButton, useTonAddress, useIsConnectionRestored } from '@tonconnect/ui-react';
import { useEffect } from 'react';
import { api } from '@/api';

interface Props {
  currentAddress: string;
  onLinked: (address: string) => void;
}

export function WalletButton({ currentAddress, onLinked }: Props) {
  const address = useTonAddress();
  const restored = useIsConnectionRestored();

  useEffect(() => {
    if (!restored || !address) return;
    if (address === currentAddress) return;
    api.linkWallet(address)
      .then(() => onLinked(address))
      .catch(() => {});
  }, [address, restored, currentAddress, onLinked]);

  if (!restored) return null;

  return (
    <div style={{
      marginTop: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      zIndex: 3,
    }}>
      <TonConnectButton />
      {address && (
        <p style={{
          fontSize: '9px',
          color: '#444444',
          letterSpacing: '2px',
        }}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      )}
    </div>
  );
}