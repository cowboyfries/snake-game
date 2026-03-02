import { useState, useEffect, useCallback } from 'react';
import type { DashboardRow } from '../../shared/types';

export function useDashboard() {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.api.getDashboard();
      setRows(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60000); // Auto-refresh every 60s
    return () => clearInterval(interval);
  }, [fetch]);

  // Listen for live price updates
  useEffect(() => {
    const cleanup = window.api.onPriceUpdate((prices) => {
      setRows(prev => prev.map(row => {
        const updated = prices.find(p => p.symbol === row.watchlistItem.symbol);
        if (updated) {
          return { ...row, price: updated };
        }
        return row;
      }));
    });
    return cleanup;
  }, []);

  return { rows, loading, error, refresh: fetch };
}
