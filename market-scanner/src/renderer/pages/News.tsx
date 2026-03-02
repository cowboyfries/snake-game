import React, { useState } from 'react';
import { useNews } from '../hooks/useNews';
import { useWatchlist } from '../hooks/useWatchlist';
import NewsCard from '../components/NewsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';

export default function News() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>(undefined);
  const { articles, loading, error, refresh } = useNews(selectedSymbol);
  const { items: watchlist } = useWatchlist();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>News</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="select"
            value={selectedSymbol || ''}
            onChange={e => setSelectedSymbol(e.target.value || undefined)}
          >
            <option value="">General News</option>
            {watchlist.filter(w => w.type === 'stock').map(w => (
              <option key={w.symbol} value={w.symbol}>{w.symbol} - {w.name}</option>
            ))}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={refresh}>Refresh</button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingSpinner />
      ) : articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📰</div>
          <div style={{ fontSize: 16 }}>No news articles available</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>
            {selectedSymbol
              ? `No recent news found for ${selectedSymbol}`
              : 'Configure your Finnhub API key in Settings to enable news'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {articles.map(article => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
