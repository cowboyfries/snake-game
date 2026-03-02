import React from 'react';

interface Props {
  message: string;
  onDismiss?: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    background: 'rgba(231, 76, 60, 0.15)',
    border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    fontSize: 13,
    color: '#e8a0a0',
  },
  dismiss: {
    background: 'none',
    border: 'none',
    color: '#e8a0a0',
    cursor: 'pointer',
    fontSize: 16,
    padding: '0 4px',
  },
};

export default function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <div style={styles.banner}>
      <span>{message}</span>
      {onDismiss && (
        <button style={styles.dismiss} onClick={onDismiss}>&times;</button>
      )}
    </div>
  );
}
