import { useState, useEffect, useCallback } from 'react';
import type { SentimentData, TrendingAsset } from '../../shared/types';

export function useSentiment(symbol: string) {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!symbol) return;
    try {
      setLoading(true);
      setError(null);
      const data = await window.api.getSentiment(symbol);
      setSentiment(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => { fetch(); }, [fetch]);

  return { sentiment, loading, error, refresh: fetch };
}

export function useTrending() {
  const [trending, setTrending] = useState<TrendingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.api.getTrending();
      setTrending(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { trending, loading, error, refresh: fetch };
}
