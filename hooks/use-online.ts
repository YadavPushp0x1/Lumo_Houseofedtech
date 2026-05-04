import * as Network from 'expo-network';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useOnline(pollMs: number = 4000) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let alive = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (!alive) return;
        setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
      } catch {
        if (!alive) return;
        setIsOnline(true);
      }
    };

    check();
    interval = setInterval(check, pollMs);

    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });

    return () => {
      alive = false;
      if (interval) clearInterval(interval);
      sub.remove();
    };
  }, [pollMs]);

  return isOnline;
}

