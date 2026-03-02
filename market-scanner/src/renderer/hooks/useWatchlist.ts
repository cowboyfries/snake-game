import { useState, useEffect, useCallback } from 'react';
import type { WatchlistItem, AssetType } from '../../shared/types';

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.api.getWatchlist();
      setItems(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (item: { symbol: string; name: string; type: AssetType; coingeckoId?: string }) => {
    try {
      const newItem = await window.api.addToWatchlist(item);
      setItems(prev => [newItem, ...prev]);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      await window.api.removeFromWatchlist(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  return { items, loading, error, add, remove, refresh: fetch };
}
