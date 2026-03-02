import React, { useState } from 'react';
import type { AssetType } from '../../shared/types';

interface Props {
  onClose: () => void;
  onAdd: (item: { symbol: string; name: string; type: AssetType; coingeckoId?: string }) => void;
}

const POPULAR_ASSETS = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' as const },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' as const },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock' as const },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' as const },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' as const },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' as const },
  { symbol: 'META', name: 'Meta Platforms', type: 'stock' as const },
  { symbol: 'AMD', name: 'AMD Inc.', type: 'stock' as const },
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' as const, coingeckoId: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto' as const, coingeckoId: 'ethereum' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto' as const, coingeckoId: 'solana' },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto' as const, coingeckoId: 'dogecoin' },
  { symbol: 'XRP', name: 'XRP', type: 'crypto' as const, coingeckoId: 'ripple' },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto' as const, coingeckoId: 'cardano' },
  { symbol: 'AVAX', name: 'Avalanche', type: 'crypto' as const, coingeckoId: 'avalanche-2' },
  { symbol: 'DOT', name: 'Polkadot', type: 'crypto' as const, coingeckoId: 'polkadot' },
];

export default function SearchModal({ onClose, onAdd }: Props) {
  const [search, setSearch] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<AssetType>('stock');
  const [customCoingeckoId, setCustomCoingeckoId] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const filtered = POPULAR_ASSETS.filter(a =>
    a.symbol.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCustomAdd = () => {
    if (!customSymbol || !customName) return;
    onAdd({
      symbol: customSymbol.toUpperCase(),
      name: customName,
      type: customType,
      coingeckoId: customType === 'crypto' ? customCoingeckoId || undefined : undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Add Asset to Watchlist</div>

        <div className="form-group">
          <input
            className="input"
            placeholder="Search popular assets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ maxHeight: 250, overflowY: 'auto', marginBottom: 16 }}>
          {filtered.map(asset => (
            <div
              key={asset.symbol}
              onClick={() => onAdd(asset)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                cursor: 'pointer',
                borderRadius: 4,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <span style={{ fontWeight: 600, marginRight: 8 }}>{asset.symbol}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{asset.name}</span>
              </div>
              <span style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 3,
                background: asset.type === 'crypto' ? 'rgba(243, 156, 18, 0.15)' : 'rgba(52, 152, 219, 0.15)',
                color: asset.type === 'crypto' ? 'var(--warning)' : 'var(--info)',
              }}>
                {asset.type}
              </span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowCustom(!showCustom)}
            style={{ marginBottom: showCustom ? 12 : 0 }}
          >
            {showCustom ? 'Hide custom' : 'Add custom asset'}
          </button>

          {showCustom && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="form-row">
                <input className="input" placeholder="Symbol (e.g. AAPL)" value={customSymbol} onChange={e => setCustomSymbol(e.target.value)} />
                <input className="input" placeholder="Name" value={customName} onChange={e => setCustomName(e.target.value)} />
              </div>
              <div className="form-row">
                <select className="select" value={customType} onChange={e => setCustomType(e.target.value as AssetType)} style={{ flex: 1 }}>
                  <option value="stock">Stock</option>
                  <option value="crypto">Crypto</option>
                </select>
                {customType === 'crypto' && (
                  <input className="input" placeholder="CoinGecko ID" value={customCoingeckoId} onChange={e => setCustomCoingeckoId(e.target.value)} />
                )}
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleCustomAdd}>Add</button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
