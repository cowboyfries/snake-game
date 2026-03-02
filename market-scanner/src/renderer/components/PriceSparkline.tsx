import React from 'react';

interface Props {
  data: number[];
  width?: number;
  height?: number;
}

export default function PriceSparkline({ data, width = 100, height = 30 }: Props) {
  if (!data || data.length < 2) {
    return <div style={{ width, height, background: 'var(--bg-input)', borderRadius: 4 }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const isPositive = data[data.length - 1] >= data[0];
  const color = isPositive ? 'var(--success)' : 'var(--danger)';

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
