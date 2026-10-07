import { useEffect, useRef, useState } from 'react';
// import { getMilestoneMessage, getMultiplier } from '../utils/rank';
import { getMultiplier } from '../utils/rank';
import { getMilestoneMessage } from '../utils/milestone';

interface UseStayOptions {
  now: number;
  lastStayAt: number;
  silentDays: number;
  balance: number;
  onAward: (newBalance: number, newDays: number, newLastStay: number) => void;
}

export function useStay({ now, lastStayAt, silentDays, balance, onAward }: UseStayOptions) {
  const [isStaying, setIsStaying] = useState(false);
  const [staySeconds, setStaySeconds] = useState(0);
  const [rewardMessage, setRewardMessage] = useState('');

  const intervalRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const hasEarnedRef = useRef(false);
  const isStayingRef = useRef(false);
  const stopStayRef = useRef<() => void>(() => {});

  useEffect(() => {
    isStayingRef.current = isStaying;
  }, [isStaying]);

  const awardTokens = () => {
    const multiplier = getMultiplier(silentDays);
    const newBalance = balance + multiplier;
    const newDays = silentDays + 1;
    const newLastStay = Date.now();

    hasEarnedRef.current = true;
    onAward(newBalance, newDays, newLastStay);

    const milestone = getMilestoneMessage(newDays);
    if (milestone) {
      setRewardMessage(milestone);
      setTimeout(() => setRewardMessage(''), 5000);
    } else {
      setRewardMessage(`+${multiplier} $INDRI`);
      setTimeout(() => setRewardMessage(''), 3000);
    }
  };

  const startStay = () => {
    if (isStaying || holdTimeoutRef.current) return;
    if (now - lastStayAt < 2 * 60 * 60 * 1000) return;
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
            if (!hasEarnedRef.current) awardTokens();
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
      awardTokens();
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

  const eyesOpen = isStaying ? Math.min(staySeconds / 30, 1) : 0;

  return {
    isStaying,
    staySeconds,
    rewardMessage,
    setRewardMessage,
    eyesOpen,
    startStay,
    stopStay,
  };
}