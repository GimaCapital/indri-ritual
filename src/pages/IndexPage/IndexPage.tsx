import { useEffect, useRef, useState } from 'react';

import { EntryScreen } from './screens/EntryScreen';
import { MessageScreen } from './screens/MessageScreen';
import { PersonalScreen } from './screens/PersonalScreen';
import { VowScreen } from './screens/VowScreen';
import { RuleScreen } from './screens/RuleScreen';
import { EchoScreen } from './screens/EchoScreen';
import { SilentScreen } from './screens/SilentScreen';
import { WitnessScreen } from './screens/WitnessScreen';
import { InviteScreen } from './screens/InviteScreen';
import { DisappearedScreen } from './screens/DisappearedScreen';
import { LedgerScreen } from './screens/LedgerScreen';
import { WallScreen } from './screens/WallScreen';
import { First100Screen } from './screens/First100Screen';
import { LetterScreen } from './screens/LetterScreen';
import { ExitCountdownScreen } from './screens/ExitCountdownScreen';
import { MainScreen } from './screens/MainScreen';
import { AdminScreen } from './screens/AdminScreen';
import { ClaimScreen } from './screens/ClaimScreen';

import { api, friendlyError, type UserData } from '@/api';
import { COOLDOWN_MS, ORDER_VOICES } from './constants';

type Screen =
  | 'entry'
  | 'message'
  | 'personal'
  | 'vow'
  | 'rule'
  | 'echo'
  | 'main'
  | 'silent'
  | 'witness'
  | 'invite'
  | 'disappeared'
  | 'ledger'
  | 'wall'
  | 'first100'
  | 'letter'
  | 'claim'
  | 'admin';

export function IndexPage() {
  const [screen, setScreen] = useState<Screen>('entry');
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasCode, setHasCode] = useState(false);
  const [code, setCode] = useState('');
  const [isStaying, setIsStaying] = useState(false);
  const [staySeconds, setStaySeconds] = useState(0);
  const [rewardMessage, setRewardMessage] = useState('');
  const [now, setNow] = useState<number>(Date.now());
  const [orderVoice, setOrderVoice] = useState(ORDER_VOICES[0]);
  const [watchingMessage, setWatchingMessage] = useState('They are watching');
  const [flashNumber, setFlashNumber] = useState<string | null>(null);
  const [exitCountdown, setExitCountdown] = useState<number | null>(null);
  const [signalCooldown, setSignalCooldown] = useState(false);
  const [sigilTaps, setSigilTaps] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const hasEarnedRef = useRef(false);
  const isStayingRef = useRef(false);
  const stopStayRef = useRef<() => void>(() => {});
  const orderVoiceRef = useRef<number | null>(null);
  const watchingRef = useRef<number | null>(null);
  const sigilTapTimeoutRef = useRef<number | null>(null);

  // Authenticate on mount — wait for Telegram initData to be ready
  useEffect(() => {
    const authenticate = async () => {
      let attempts = 0;
      while (attempts < 50) {
        // @ts-ignore
        if (window.Telegram?.WebApp?.initData) break;
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      // @ts-ignore
      if (!window.Telegram?.WebApp?.initData) {
        setError('Open this app inside Telegram to continue.');
        setLoading(false);
        return;
      }

      try {
        const userData = await api.auth();
        setUser(userData);
        const savedScreen = localStorage.getItem('indri_screen');
        if (userData.hasVowed && savedScreen && savedScreen !== 'entry') {
          setScreen(savedScreen as Screen);
        } else if (userData.hasVowed) {
          setScreen('main');
        }
      } catch (e) {
        setError(friendlyError(e));
      } finally {
        setLoading(false);
      }
    };
    authenticate();
  }, []);

  // Save screen to localStorage
  useEffect(() => {
    if (screen !== 'entry') {
      localStorage.setItem('indri_screen', screen);
    }
  }, [screen]);

  // Cooldown tick
  useEffect(() => {
    if (screen !== 'main') return;
    if (!user) return;
    if (now - user.lastStayAt >= COOLDOWN_MS) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [screen, user, now]);

  // Sync staying ref
  useEffect(() => {
    isStayingRef.current = isStaying;
  }, [isStaying]);

  // Order's Voice rotation
  useEffect(() => {
    if (screen !== 'main') return;
    orderVoiceRef.current = window.setInterval(() => {
      setOrderVoice(ORDER_VOICES[Math.floor(Math.random() * ORDER_VOICES.length)]);
    }, 8000);
    return () => {
      if (orderVoiceRef.current) clearInterval(orderVoiceRef.current);
    };
  }, [screen]);

  // Watching messages
  useEffect(() => {
    if (screen !== 'main') return;
    const fetchActivity = async () => {
      try {
        const messages = await api.activity();
        if (messages.length > 0) {
          setWatchingMessage(messages[Math.floor(Math.random() * messages.length)]);
        }
      } catch (e) {
        // silent
      }
    };
    fetchActivity();
    watchingRef.current = window.setInterval(fetchActivity, 15000);
    return () => {
      if (watchingRef.current) clearInterval(watchingRef.current);
    };
  }, [screen]);

  // Exit countdown
  useEffect(() => {
    if (exitCountdown === null) return;
    if (exitCountdown <= 0) {
      window.close();
      setTimeout(() => {
        localStorage.clear();
        window.location.reload();
      }, 500);
      return;
    }
    const timer = setTimeout(() => {
      setExitCountdown(exitCountdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [exitCountdown]);

  const handleEntrySuccess = (wasInvited: boolean) => {
    setHasCode(wasInvited);
    if (wasInvited && user) setUser({ ...user, wasInvited: true });
    setScreen('message');
  };

  const handleMessageDone = () => {
    if (hasCode) setScreen('personal');
    else setScreen('vow');
  };

  const handlePersonalDone = () => {
    setScreen('vow');
  };

  const handleVow = async (accepted: boolean) => {
    if (accepted) {
      try {
        await api.vow();
        if (user) setUser({ ...user, hasVowed: true });
      } catch (e) {
        // silent
      }
      setScreen('rule');
    } else {
      setExitCountdown(4);
    }
  };

  const handleRuleDone = () => {
    setScreen('echo');
  };

  const handleEchoDone = () => {
    setScreen('main');
  };

  const showFlashNumber = () => {
    const num = Math.floor(Math.random() * 9000) + 1000;
    setFlashNumber(num.toString());
    setTimeout(() => setFlashNumber(null), 1000);
  };

  const finishStay = async () => {
    if (!user || hasEarnedRef.current) return;
    hasEarnedRef.current = true;
    try {
      const updated = await api.stay();
      setRewardMessage(`+${updated.balance - user.balance} $INDRI`);
      setUser(updated);
      setTimeout(() => setRewardMessage(''), 3000);
      if (Math.random() < 0.3) setTimeout(() => showFlashNumber(), 1500);
    } catch (e) {
      setRewardMessage(friendlyError(e));
      setTimeout(() => setRewardMessage(''), 3000);
    }
  };

  const startStay = () => {
    if (isStaying || holdTimeoutRef.current) return;
    if (!user) return;
    if (now - user.lastStayAt < COOLDOWN_MS) return;
    hasEarnedRef.current = false;

    holdTimeoutRef.current = window.setTimeout(() => {
      holdTimeoutRef.current = null;
      setIsStaying(true);
      setStaySeconds(0);

      intervalRef.current = window.setInterval(() => {
        setStaySeconds(prev => {
          const next = prev + 1;
          if (next >= 90) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsStaying(false);
            if (!hasEarnedRef.current) finishStay();
            return next;
          }
          return next;
        });
      }, 1000);
    }, 200);
  };

  const stopStay = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isStaying && staySeconds >= 30 && !hasEarnedRef.current) {
      finishStay();
    } else if (isStaying && staySeconds < 30 && staySeconds > 0) {
      setRewardMessage('You left too soon.');
      setTimeout(() => setRewardMessage(''), 3000);
    }
    setIsStaying(false);
    setStaySeconds(0);
  };

  useEffect(() => {
    stopStayRef.current = stopStay;
  }, [stopStay]);

  useEffect(() => {
    const handleGlobalUp = () => {
      if (isStayingRef.current || holdTimeoutRef.current) {
        stopStayRef.current();
      }
    };
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, []);

  const handleSigilTap = () => {
    if (sigilTapTimeoutRef.current) clearTimeout(sigilTapTimeoutRef.current);
    const newTaps = sigilTaps + 1;
    setSigilTaps(newTaps);
    if (newTaps >= 7) {
      setSigilTaps(0);
      setScreen('letter');
      return;
    }
    sigilTapTimeoutRef.current = window.setTimeout(() => setSigilTaps(0), 2000);
  };

  const handleSignal = async () => {
    if (signalCooldown || !user) return;
    setSignalCooldown(true);
    try {
      const result = await api.signalTap();

      if (result.outcome === 'traded') {
        setUser({ ...user, balance: user.balance + 300 });
        setRewardMessage('Two hands reached out at the same moment.');
      } else if (result.outcome === 'live') {
        setRewardMessage('Your signal goes into the dark. It will find someone.');
      } else {
        setRewardMessage('Signal sent.');
      }

      setTimeout(() => {
        setRewardMessage('');
        setSignalCooldown(false);
      }, 4000);
    } catch (e) {
      setRewardMessage(friendlyError(e));
      setTimeout(() => {
        setRewardMessage('');
        setSignalCooldown(false);
      }, 3000);
    }
  };

  const addWallMark = async () => {
    if (!user || user.hasMarkedToday) return;
    try {
      await api.addTrace();
      setUser({
        ...user,
        wallMarks: [...user.wallMarks, Date.now()],
        hasMarkedToday: true,
      });
    } catch (e) {
      setRewardMessage(friendlyError(e));
      setTimeout(() => setRewardMessage(''), 3000);
    }
  };

  const resetWallMark = () => {};

  const eyesOpen = isStaying ? Math.min(staySeconds / 30, 1) : 0;
  const cooldownRemaining = user ? Math.max(0, COOLDOWN_MS - (now - user.lastStayAt)) : 0;
  const isOnCooldown = cooldownRemaining > 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#050505', color: '#555555', fontFamily: 'monospace', letterSpacing: '4px' }}>
        OPENING...
      </div>
    );
  }

  if (error && !user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#050505', color: '#ffffff', fontFamily: 'monospace', padding: '24px', textAlign: 'center' }}>
        <p style={{ letterSpacing: '4px', marginBottom: '20px' }}>THE ORDER IS SILENT</p>
        <p style={{ fontSize: '11px', color: '#555555' }}>{error}</p>
      </div>
    );
  }

  if (exitCountdown !== null) {
    return <ExitCountdownScreen countdown={exitCountdown} />;
  }

  if (screen === 'entry') {
    return (
      <EntryScreen
        code={code}
        setCode={setCode}
        onSuccess={handleEntrySuccess}
      />
    );
  }

  if (screen === 'message') {
    return <MessageScreen hasCode={hasCode} onDone={handleMessageDone} />;
  }

  if (screen === 'personal') {
    return (
      <PersonalScreen
        entryNumber={user?.entryNumber || 0}
        invitedBy={user?.invitedBy}
        onDone={handlePersonalDone}
      />
    );
  }

  if (screen === 'vow') {
    return (
      <VowScreen
        onAccept={() => handleVow(true)}
        onReject={() => handleVow(false)}
      />
    );
  }

  if (screen === 'rule') {
    return <RuleScreen onDone={handleRuleDone} />;
  }

  if (screen === 'echo') {
    return <EchoScreen secretEcho={user?.secretEcho || ''} onDone={handleEchoDone} />;
  }

  if (screen === 'silent') {
    return (
      <SilentScreen
        secretEcho={user?.secretEcho || ''}
        silentDays={user?.silentDays || 0}
        onReturn={() => setScreen('main')}
      />
    );
  }

  if (screen === 'witness') {
    return <WitnessScreen onReturn={() => setScreen('main')} />;
  }

  if (screen === 'invite') {
    return (
      <InviteScreen
        wasInvited={user?.wasInvited || false}
        silentDays={user?.silentDays || 0}
        onReturn={() => setScreen('main')}
      />
    );
  }

  if (screen === 'disappeared') {
    return <DisappearedScreen onReturn={() => setScreen('main')} />;
  }

  if (screen === 'ledger') {
    return (
      <LedgerScreen
        onReturn={() => setScreen('main')}
        onGoToClaim={() => setScreen('claim')}
        canClaim={Boolean(user?.walletAddress) && (user?.balance || 0) >= 1000}
      />
    );
  }

  if (screen === 'wall') {
    return (
      <WallScreen
        hasMarkedToday={user?.hasMarkedToday || false}
        onAddMark={addWallMark}
        onResetMark={resetWallMark}
        onReturn={() => setScreen('main')}
      />
    );
  }

  if (screen === 'first100') {
    return <First100Screen onReturn={() => setScreen('main')} />;
  }

  if (screen === 'letter') {
    return <LetterScreen onReturn={() => setScreen('main')} />;
  }

  if (screen === 'claim') {
    return (
      <ClaimScreen
        balance={user?.balance || 0}
        walletAddress={user?.walletAddress || ''}
        lastClaimAt={user?.lastClaimAt || 0}
        onReturn={() => setScreen('main')}
        onSuccess={(amount) => {
          if (user) {
            setUser({
              ...user,
              balance: 0,
              lastClaimAt: Date.now(),
              totalClaimed: (user.totalClaimed || 0) + amount,
            });
          }
        }}
      />
    );
  }

  if (screen === 'admin') {
    return <AdminScreen onReturn={() => setScreen('main')} />;
  }

  return (
    <MainScreen
      silentDays={user?.silentDays || 0}
      balance={user?.balance || 0}
      secretEcho={user?.secretEcho || ''}
      entryNumber={user?.entryNumber || 0}
      isStaying={isStaying}
      staySeconds={staySeconds}
      eyesOpen={eyesOpen}
      rewardMessage={rewardMessage}
      orderVoice={orderVoice}
      watchingMessage={watchingMessage}
      flashNumber={flashNumber}
      isOnCooldown={isOnCooldown}
      cooldownRemaining={cooldownRemaining}
      signalCooldown={signalCooldown}
      signalsQueued={user?.signalsQueued || 0}
      signalsArrived={user?.signalsArrived || 0}
      onStartStay={startStay}
      onStopStay={stopStay}
      onSigilTap={handleSigilTap}
      onSignal={handleSignal}
      onGoTo={(s) => setScreen(s as Screen)}
      isAdmin={user?.isAdmin || false}
      onGoToAdmin={() => setScreen('admin')}
      walletAddress={user?.walletAddress || ''}
      onWalletLinked={(address) => {
        if (user) setUser({ ...user, walletAddress: address });
      }}
    />
  );
}