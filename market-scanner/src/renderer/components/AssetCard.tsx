import React from 'react';
import type { PriceData } from '../../shared/types';

interface Props {
  price: PriceData;
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(6)}`;
}

export default function AssetCard({ price }: Props) {
  const isPositive = price.changePercent24h >= 0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{price.symbol}</span>
        <span style={{
          fontSize: 11,
          padding: '2px 6px',
          borderRadius: 3,
          background: price.type === 'crypto' ? 'rgba(243, 156, 18, 0.15)' : 'rgba(52, 152, 219, 0.15)',
          color: price.type === 'crypto' ? 'var(--warning)' : 'var(--info)',
        }}>
          {price.type}
        </span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
        {formatPrice(price.price)}
      </div>
      <div style={{ fontSize: 13, color: isPositive ? 'var(--success)' : 'var(--danger)' }}>
        {isPositive ? '+' : ''}{price.changePercent24h.toFixed(2)}%
        <span style={{ marginLeft: 8, fontSize: 12 }}>
          ({isPositive ? '+' : ''}{formatPrice(Math.abs(price.change24h))})
        </span>
      </div>
    </div>
  );
}
