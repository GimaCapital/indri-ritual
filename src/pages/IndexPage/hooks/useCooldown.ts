import { useEffect, useState } from 'react';
import { COOLDOWN_MS } from '../constants';

export function useCooldown(screen: string, lastStayAt: number) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (screen !== 'main') return;
    if (now - lastStayAt >= COOLDOWN_MS) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [screen, lastStayAt, now]);

  const remaining = Math.max(0, COOLDOWN_MS - (now - lastStayAt));
  const isOnCooldown = remaining > 0;

  return { now, remaining, isOnCooldown, setNow };
}