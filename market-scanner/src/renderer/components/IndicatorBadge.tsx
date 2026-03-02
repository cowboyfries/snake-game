import React from 'react';

interface Props {
  label: string;
  value: number | null;
  thresholds?: { low: number; high: number };
}

export default function IndicatorBadge({ label, value, thresholds }: Props) {
  if (value === null) {
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        background: 'var(--bg-input)',
        color: 'var(--text-muted)',
      }}>
        {label}: --
      </span>
    );
  }

  let color = 'var(--warning)';
  let bg = 'rgba(243, 156, 18, 0.15)';

  if (thresholds) {
    if (value <= thresholds.low) {
      color = 'var(--success)';
      bg = 'rgba(78, 204, 163, 0.15)';
    } else if (value >= thresholds.high) {
      color = 'var(--danger)';
      bg = 'rgba(231, 76, 60, 0.15)';
    }
  }

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 600,
      background: bg,
      color,
    }}>
      {label}: {value.toFixed(1)}
    </span>
  );
}
