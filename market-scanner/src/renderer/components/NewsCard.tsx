import React from 'react';
import type { NewsArticle } from '../../shared/types';

interface Props {
  article: NewsArticle;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    gap: 12,
    padding: 14,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  image: {
    width: 80,
    height: 60,
    borderRadius: 4,
    objectFit: 'cover' as const,
    background: 'var(--bg-input)',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  headline: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.3,
    color: 'var(--text-primary)',
  },
  meta: {
    fontSize: 12,
    color: 'var(--text-muted)',
    display: 'flex',
    gap: 8,
  },
  summary: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  },
};

export default function NewsCard({ article }: Props) {
  const handleClick = () => {
    window.open(article.url, '_blank');
  };

  return (
    <div style={styles.card} onClick={handleClick} role="button" tabIndex={0}>
      {article.imageUrl && (
        <img src={article.imageUrl} alt="" style={styles.image} />
      )}
      <div style={styles.content}>
        <div style={styles.headline}>{article.headline}</div>
        <div style={styles.meta}>
          <span>{article.source}</span>
          <span>{timeAgo(article.publishedAt)}</span>
        </div>
        {article.summary && (
          <div style={styles.summary}>{article.summary}</div>
        )}
      </div>
    </div>
  );
}
