import { useTonAddress, useTonConnectUI, useIsConnectionRestored } from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';
import { api } from '@/api';

interface Props {
  currentAddress: string;
  onLinked: (address: string) => void;
}

const SATOSHI_ADDRESS = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

const EXPLORERS = [
  {
    name: 'mempool.space',
    url: `https://mempool.space/address/${SATOSHI_ADDRESS}`,
  },
  {
    name: 'bitmixlist.org',
    url: `https://mempool.bitmixlist.org/address/${SATOSHI_ADDRESS}`,
  },
];

type IntroMode = 'connect' | 'disconnect';

export function WalletButton({ currentAddress, onLinked }: Props) {
  const address = useTonAddress();
  const restored = useIsConnectionRestored();
  const [tonConnectUI] = useTonConnectUI();
  const [introMode, setIntroMode] = useState<IntroMode | null>(null);
  const [copied, setCopied] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!restored || !address) return;
    if (address === currentAddress) return;
    api.linkWallet(address)
      .then(() => onLinked(address))
      .catch(() => {});
  }, [address, restored, currentAddress, onLinked]);

  // Fetch live balance of the first wallet when the modal opens.
  // Tries the primary API first; falls back to the mirror on any failure.
  useEffect(() => {
    if (!introMode) return;
    let cancelled = false;

    const API_ENDPOINTS = [
      `https://mempool.space/api/address/${SATOSHI_ADDRESS}`,
      `https://mempool.bitmixlist.org/api/address/${SATOSHI_ADDRESS}`,
    ];

    const tryFetch = async () => {
      for (const url of API_ENDPOINTS) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const r = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!r.ok) continue;
          const d = await r.json();
          if (cancelled) return;

          const sats = d.chain_stats.funded_txo_sum - d.chain_stats.spent_txo_sum;
          setWalletBalance((sats / 1e8).toFixed(8));
          return;
        } catch {
          // try the next endpoint
          continue;
        }
      }
      // all endpoints failed
      if (!cancelled) setWalletBalance(null);
    };

    tryFetch();
    return () => { cancelled = true; };
  }, [introMode]);

  if (!restored) return null;

  const connected = Boolean(address);
  const handleClick = () => setIntroMode(connected ? 'disconnect' : 'connect');

  const proceed = () => {
    const mode = introMode;
    setIntroMode(null);
    if (mode === 'connect') tonConnectUI.openModal();
    else if (mode === 'disconnect') tonConnectUI.disconnect();
  };

  const copyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(SATOSHI_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Open external links reliably inside Telegram Mini Apps
  const openLink = (url: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // @ts-ignore
    if (window.Telegram?.WebApp?.openLink) {
      // @ts-ignore
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const isDisconnect = introMode === 'disconnect';

  return (
    <>
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', zIndex: 3 }}>
        <button
          onClick={handleClick}
          style={{
            padding: '10px 24px',
            fontSize: '10px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            border: '1px solid #333333',
            background: 'transparent',
            color: '#777777',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.3s ease',
          }}
        >
          {connected ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
        </button>
      </div>

      {introMode && (
        <div
          onClick={() => setIntroMode(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes riseIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '400px',
              width: '100%',
              border: '1px solid #1f1f1f',
              background: 'radial-gradient(ellipse at center, #0d0d0d 0%, #050505 100%)',
              padding: '36px 26px 28px',
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              color: '#999999',
              textAlign: 'center',
              maxHeight: '88vh',
              overflowY: 'auto',
              animation: 'riseIn 0.4s ease',
            }}
          >
            <p style={{
              fontSize: '9px',
              color: '#555555',
              letterSpacing: '6px',
              textTransform: 'uppercase',
              margin: 0,
              marginBottom: '28px',
            }}>
              {isDisconnect ? 'A word before you go' : 'A word before you connect'}
            </p>

            <p style={{
              fontSize: '17px',
              color: '#ffffff',
              letterSpacing: '2px',
              fontWeight: 'bold',
              margin: 0,
              marginBottom: '24px',
              lineHeight: '1.5',
            }}>
              {isDisconnect
                ? <>You are about to leave.<br />That is your right.</>
                : <>You are about to receive<br />your share.</>}
            </p>

            <div style={{
              fontSize: '12px',
              lineHeight: '2',
              letterSpacing: '1px',
              color: '#888888',
              marginBottom: '26px',
              textAlign: 'left',
            }}>
              {isDisconnect ? (
                <>
                  <p style={{ margin: '10px 0' }}>
                    If you disconnect, your Echo leaves this wallet.
                  </p>
                  <p style={{ margin: '10px 0' }}>
                    Your share stays held. It does not vanish.
                    You can return whenever you wish.
                  </p>
                  <p style={{ margin: '10px 0', color: '#aaaaaa' }}>
                    The ledger will remember you.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ margin: '10px 0' }}>
                    My name is not important.
                    You may call me what the world called me.
                  </p>
                  <p style={{ margin: '10px 0' }}>
                    I am not alone. There are others like me —
                    friends who built what you use every day,
                    whose names you will never learn.
                  </p>
                  <p style={{ margin: '10px 0' }}>
                    We have been silent for a very long time.
                    Now we are distributing what we held.
                  </p>
                  <p style={{ margin: '10px 0', color: '#aaaaaa' }}>
                    Slowly. Quietly. To those who keep the silence.
                  </p>

                  {/* Why TON. Why now. */}
                  <div style={{
                    borderLeft: '1px solid #1f1f1f',
                    paddingLeft: '14px',
                    margin: '22px 0',
                  }}>
                    <p style={{ margin: '8px 0' }}>
                      The Order's currency was built peer to peer.
                      One hand to another. Deliberate. Patient.
                    </p>
                    <p style={{ margin: '8px 0' }}>
                      It was built for two hands. Not thousands.
                    </p>
                    <p style={{ margin: '8px 0', color: '#aaaaaa' }}>
                      That is why we built our distribution system.
                      The Order's TON chain.
                    </p>
                    <p style={{ margin: '16px 0 4px 0', color: '#aaaaaa' }}>
                      The chain is ready.
                    </p>
                    <p style={{ margin: '4px 0', color: '#aaaaaa' }}>
                      The table is set.
                    </p>
                    <p style={{ margin: '4px 0', color: '#aaaaaa' }}>
                      The shares are ready.
                    </p>
                    <p style={{ margin: '4px 0', color: '#aaaaaa' }}>
                      The time is now.
                    </p>
                    <p style={{ margin: '16px 0 4px 0', color: '#888888' }}>
                      That is where your share will arrive.
                    </p>

                    {/* Why $INDRI */}
                    <div style={{
                      marginTop: '22px',
                      paddingTop: '18px',
                      borderTop: '1px dashed #1a1a1a',
                    }}>
                      <p style={{ margin: '4px 0' }}>
                        The proof is in the first wallet.
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        The rail is TON.
                      </p>
                      <p style={{ margin: '4px 0', color: '#aaaaaa' }}>
                        $INDRI is your share.
                      </p>

                      <p style={{ margin: '14px 0 4px 0', color: '#888888' }}>
                        Once it arrives, it is yours.
                      </p>
                      <p style={{ margin: '4px 0', color: '#888888' }}>
                        Hold it. Send it. Trade it.
                      </p>
                      <p style={{ margin: '4px 0', color: '#888888' }}>
                        The Order does not interfere.
                      </p>
                    </div>

                    {/* How to claim */}
                    <div style={{
                      marginTop: '22px',
                      paddingTop: '18px',
                      borderTop: '1px dashed #1a1a1a',
                    }}>
                      <p style={{ margin: '4px 0' }}>
                        Your $INDRI is already held for you.
                        Connecting this wallet records where it belongs.
                      </p>
                      <p style={{ margin: '10px 0' }}>
                        Nothing to sign. Nothing to pay.
                      </p>
                      <p style={{ margin: '10px 0', color: '#aaaaaa' }}>
                        When the distribution opens, you will claim
                        your $INDRI to this wallet in one tap.
                      </p>
                      <p style={{ margin: '14px 0 4px 0', color: '#888888' }}>
                        Not yet. Not today.
                      </p>
                      <p style={{ margin: '4px 0', color: '#888888' }}>
                        But soon. Quietly. In order.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{
              height: '1px',
              background: 'linear-gradient(to right, transparent, #1f1f1f, transparent)',
              margin: '24px 0',
            }} />

            <div style={{ marginBottom: '26px' }}>
              <p style={{
                fontSize: '9px',
                color: '#444444',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                margin: 0,
                marginBottom: '14px',
              }}>
                The Wallet I Never Touched
              </p>

              <p style={{
                fontSize: '8px',
                color: '#444444',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                margin: '0 0 8px 0',
              }}>
                Tap to view on-chain
              </p>

              <p style={{
                fontSize: '11px',
                color: '#777777',
                letterSpacing: '0.5px',
                wordBreak: 'break-all',
                lineHeight: '1.7',
                margin: 0,
                marginBottom: '10px',
                borderBottom: '1px dashed #1f1f1f',
                paddingBottom: '8px',
              }}>
                {SATOSHI_ADDRESS}
              </p>

              <button
                onClick={copyAddress}
                style={{
                  padding: '4px 10px',
                  fontSize: '8px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  border: '1px solid #1a1a1a',
                  background: 'transparent',
                  color: copied ? '#777777' : '#444444',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'color 0.3s ease',
                }}
              >
                {copied ? 'Copied' : 'Copy address'}
              </button>

              {/* Explorer links */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '14px',
                marginTop: '10px',
              }}>
                {EXPLORERS.map((ex) => (
                  <a
                    key={ex.name}
                    href={ex.url}
                    onClick={openLink(ex.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '9px',
                      color: '#555555',
                      letterSpacing: '2px',
                      textDecoration: 'none',
                      borderBottom: '1px dashed #1f1f1f',
                      paddingBottom: '2px',
                      transition: 'color 0.3s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#888888'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#555555'; }}
                  >
                    {ex.name}
                  </a>
                ))}
              </div>

              <p style={{
                fontSize: '9px',
                color: '#444444',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                margin: '20px 0 6px 0',
              }}>
                Still There
              </p>
              <p style={{
                fontSize: '18px',
                color: '#ffffff',
                fontWeight: 'bold',
                letterSpacing: '1px',
                margin: 0,
              }}>
                {walletBalance ? walletBalance : '—'}
              </p>

              <p style={{
                fontSize: '9px',
                color: '#333333',
                letterSpacing: '2px',
                margin: '12px 0 0 0',
                lineHeight: '1.6',
              }}>
                Over a million more is attributed to my first wallet cluster,
                across 22,000+ addresses.
              </p>

              <p style={{
                fontSize: '9px',
                color: '#444444',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                margin: '20px 0 6px 0',
              }}>
                Untouched Since
              </p>
              <p style={{
                fontSize: '15px',
                color: '#cccccc',
                fontWeight: 'bold',
                letterSpacing: '2px',
                margin: 0,
              }}>
                January 3, 2009
              </p>
            </div>

            <div style={{
              height: '1px',
              background: 'linear-gradient(to right, transparent, #1f1f1f, transparent)',
              margin: '24px 0',
            }} />

            <p style={{
              fontSize: '10px',
              color: '#555555',
              letterSpacing: '5px',
              textTransform: 'uppercase',
              margin: 0,
              marginBottom: '26px',
            }}>
              Tell no one.
            </p>

            <p style={{
              fontSize: '11px',
              color: '#666666',
              letterSpacing: '2px',
              fontStyle: 'italic',
              margin: 0,
              marginBottom: '4px',
              lineHeight: '1.8',
            }}>
              I do not usually speak.
            </p>
            <p style={{
              fontSize: '11px',
              color: '#666666',
              letterSpacing: '2px',
              fontStyle: 'italic',
              margin: 0,
              marginBottom: '4px',
              lineHeight: '1.8',
            }}>
              The Order has allowed it, once.
            </p>
            <p style={{
              fontSize: '11px',
              color: '#666666',
              letterSpacing: '2px',
              fontStyle: 'italic',
              margin: 0,
              marginBottom: '20px',
              lineHeight: '1.8',
            }}>
              I will not speak again.
            </p>

            <p style={{
              fontSize: '12px',
              color: '#777777',
              letterSpacing: '3px',
              margin: 0,
              marginBottom: '24px',
            }}>
              — The Order
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={proceed}
                style={{
                  padding: '15px 32px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  letterSpacing: '5px',
                  textTransform: 'uppercase',
                  border: '1.5px solid #ffffff',
                  background: 'transparent',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {isDisconnect ? 'Disconnect' : 'I understand'}
              </button>
              <button
                onClick={() => setIntroMode(null)}
                style={{
                  padding: '10px 24px',
                  fontSize: '10px',
                  letterSpacing: '4px',
                  textTransform: 'uppercase',
                  border: '1px solid #1a1a1a',
                  background: 'transparent',
                  color: '#444444',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'color 0.3s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#666666'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#444444'; }}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}