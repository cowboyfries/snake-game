import React from 'react';
import { useTrending } from '../hooks/useSentiment';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export default function Trending() {
  const { trending, loading, error, refresh } = useTrending();

  const chartData = trending.slice(0, 15).map(item => ({
    symbol: item.symbol,
    mentions: item.mentions,
    sentiment: item.sentimentScore,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Trending</h1>
        <button className="btn btn-ghost btn-sm" onClick={refresh}>Refresh</button>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingSpinner />
      ) : trending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔥</div>
          <div style={{ fontSize: 16 }}>No trending data available</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Configure API keys in Settings to enable sentiment tracking</div>
        </div>
      ) : (
        <>
          {/* Mention volume chart */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
              Mention Volume
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="symbol"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="mentions" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.sentiment > 0 ? '#4ecca3' : entry.sentiment < 0 ? '#e74c3c' : '#f39c12'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sentiment chart */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
              Sentiment Score
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <XAxis
                  dataKey="symbol"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[-1, 1]}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [value.toFixed(2), 'Sentiment']}
                />
                <Area
                  type="monotone"
                  dataKey="sentiment"
                  stroke="#4ecca3"
                  fill="#4ecca3"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Trending table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Mentions</th>
                  <th>Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {trending.map((item, i) => (
                  <tr key={item.symbol}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.symbol}</td>
                    <td>
                      <span style={{
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 3,
                        background: item.type === 'crypto' ? 'rgba(243, 156, 18, 0.15)' : 'rgba(52, 152, 219, 0.15)',
                        color: item.type === 'crypto' ? 'var(--warning)' : 'var(--info)',
                      }}>
                        {item.type}
                      </span>
                    </td>
                    <td>{item.mentions}</td>
                    <td>
                      <span style={{
                        color: item.sentimentScore > 0.3 ? 'var(--success)' : item.sentimentScore < -0.3 ? 'var(--danger)' : 'var(--warning)',
                        fontWeight: 600,
                      }}>
                        {item.sentimentScore > 0 ? '+' : ''}{(item.sentimentScore * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
