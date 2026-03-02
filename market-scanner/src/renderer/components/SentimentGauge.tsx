import React from 'react';
import type { SentimentData } from '../../shared/types';

interface Props {
  sentiment: SentimentData | null;
  compact?: boolean;
}

export default function SentimentGauge({ sentiment, compact }: Props) {
  if (!sentiment) {
    return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>--</span>;
  }

  const score = sentiment.score;
  const label = score > 0.3 ? 'Bullish' : score < -0.3 ? 'Bearish' : 'Neutral';
  const color = score > 0.3 ? 'var(--success)' : score < -0.3 ? 'var(--danger)' : 'var(--warning)';

  if (compact) {
    return (
      <span style={{ color, fontSize: 12, fontWeight: 600 }}>
        {label} ({sentiment.totalMentions})
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color }}>
          {label} ({(score * 100).toFixed(0)}%)
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          {sentiment.totalMentions} mentions
        </span>
      </div>
      <div style={{
        height: 6,
        borderRadius: 3,
        background: 'var(--bg-input)',
        overflow: 'hidden',
        display: 'flex',
      }}>
        <div style={{
          width: `${sentiment.bullishPercent}%`,
          background: 'var(--success)',
          transition: 'width 0.3s',
        }} />
        <div style={{
          width: `${sentiment.bearishPercent}%`,
          background: 'var(--danger)',
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  );
}
