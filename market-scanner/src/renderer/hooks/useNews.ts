import { useState, useEffect, useCallback } from 'react';
import type { NewsArticle } from '../../shared/types';

export function useNews(symbol?: string) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = symbol
        ? await window.api.getNewsForSymbol(symbol)
        : await window.api.getGeneralNews();
      setArticles(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => { fetch(); }, [fetch]);

  return { articles, loading, error, refresh: fetch };
}
