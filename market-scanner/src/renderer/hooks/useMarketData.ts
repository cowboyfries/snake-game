import { useState, useEffect, useCallback } from 'react';
import type { PriceData, HistoricalDataPoint, TechnicalIndicators, AssetType } from '../../shared/types';

export function usePrice(symbol: string, type: AssetType, coingeckoId?: string) {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!symbol) return;
    try {
      setLoading(true);
      setError(null);
      const data = await window.api.getPrice(symbol, type, coingeckoId);
      setPrice(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [symbol, type, coingeckoId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { price, loading, error, refresh: fetch };
}

export function useHistorical(symbol: string, type: AssetType, days: number, coingeckoId?: string) {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.getHistorical(symbol, type, days, coingeckoId);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [symbol, type, days, coingeckoId]);

  return { data, loading, error };
}

export function useIndicators(symbol: string, type: AssetType, coingeckoId?: string) {
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await window.api.getIndicators(symbol, type, coingeckoId);
        if (!cancelled) setIndicators(result);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [symbol, type, coingeckoId]);

  return { indicators, loading, error };
}
