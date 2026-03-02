import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useWatchlist } from '../hooks/useWatchlist';
import IndicatorBadge from '../components/IndicatorBadge';
import SentimentGauge from '../components/SentimentGauge';
import PriceSparkline from '../components/PriceSparkline';
import SearchModal from '../components/SearchModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import type { AssetType } from '../../shared/types';

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(6)}`;
}

export default function Dashboard() {
  const { rows, loading, error, refresh } = useDashboard();
  const { add, remove } = useWatchlist();
  const [showSearch, setShowSearch] = useState(false);

  const handleAdd = async (item: { symbol: string; name: string; type: AssetType; coingeckoId?: string }) => {
    await add(item);
    setShowSearch(false);
    refresh();
  };

  const handleRemove = async (id: number) => {
    await remove(id);
    refresh();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={refresh}>Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowSearch(true)}>+ Add Asset</button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => {}} />}

      {loading && rows.length === 0 ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>Your watchlist is empty</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Add stocks or crypto to start tracking</div>
          <button className="btn btn-primary" onClick={() => setShowSearch(true)}>+ Add Your First Asset</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Price</th>
                <th>24h Change</th>
                <th>7d Chart</th>
                <th>RSI</th>
                <th>MACD</th>
                <th>Sentiment</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const isPositive = (row.price?.changePercent24h ?? 0) >= 0;
                return (
                  <tr key={row.watchlistItem.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{row.watchlistItem.symbol}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.watchlistItem.name}</div>
                        </div>
                        <span style={{
                          fontSize: 10,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: row.watchlistItem.type === 'crypto' ? 'rgba(243, 156, 18, 0.15)' : 'rgba(52, 152, 219, 0.15)',
                          color: row.watchlistItem.type === 'crypto' ? 'var(--warning)' : 'var(--info)',
                        }}>
                          {row.watchlistItem.type}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {row.price ? formatPrice(row.price.price) : '--'}
                    </td>
                    <td>
                      {row.price ? (
                        <span className={isPositive ? 'positive' : 'negative'}>
                          {isPositive ? '+' : ''}{row.price.changePercent24h.toFixed(2)}%
                        </span>
                      ) : '--'}
                    </td>
                    <td>
                      <PriceSparkline data={row.sparkline} />
                    </td>
                    <td>
                      <IndicatorBadge
                        label="RSI"
                        value={row.indicators?.rsi ?? null}
                        thresholds={{ low: 30, high: 70 }}
                      />
                    </td>
                    <td>
                      {row.indicators?.macd ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          <div style={{
                            width: 40,
                            height: 8,
                            borderRadius: 4,
                            background: 'var(--bg-input)',
                            overflow: 'hidden',
                            position: 'relative',
                          }}>
                            <div style={{
                              position: 'absolute',
                              left: '50%',
                              width: `${Math.min(50, Math.abs(row.indicators.macd.histogram) * 10)}%`,
                              height: '100%',
                              background: row.indicators.macd.histogram >= 0 ? 'var(--success)' : 'var(--danger)',
                              transform: row.indicators.macd.histogram >= 0 ? 'none' : 'translateX(-100%)',
                            }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {row.indicators.macd.histogram.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>--</span>
                      )}
                    </td>
                    <td>
                      <SentimentGauge sentiment={row.sentiment} compact />
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemove(row.watchlistItem.id)}
                        title="Remove from watchlist"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showSearch && (
        <SearchModal onClose={() => setShowSearch(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
