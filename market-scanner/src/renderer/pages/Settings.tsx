import React, { useState, useEffect } from 'react';
import type { ApiKeys } from '../../shared/types';

export default function Settings() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form state
  const [redditClientId, setRedditClientId] = useState('');
  const [redditClientSecret, setRedditClientSecret] = useState('');
  const [finnhubApiKey, setFinnhubApiKey] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const keys = await window.api.getApiKeys();
        setApiKeys(keys);
        setRedditClientId(keys.redditClientId || '');
        setRedditClientSecret(keys.redditClientSecret || '');
        setFinnhubApiKey(keys.finnhubApiKey || '');
      } catch { /* skip */ }
      setLoading(false);
    })();
  }, []);

  const saveKey = async (key: string, value: string, label: string) => {
    setSaving(key);
    try {
      await window.api.setApiKey(key, value);
      setMessage(`${label} saved successfully`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    }
    setSaving(null);
  };

  const handleClearCache = async () => {
    try {
      await window.api.clearCache();
      setMessage('Cache cleared successfully');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    }
  };

  const maskValue = (value: string) => {
    if (!value || value.length <= 4) return value;
    return '*'.repeat(value.length - 4) + value.slice(-4);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading settings...</div>;
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 className="page-title">Settings</h1>

      {message && (
        <div style={{
          padding: '8px 14px',
          borderRadius: 'var(--radius-sm)',
          background: message.startsWith('Error') ? 'rgba(231, 76, 60, 0.15)' : 'rgba(78, 204, 163, 0.15)',
          color: message.startsWith('Error') ? '#e8a0a0' : 'var(--success)',
          fontSize: 13,
          marginBottom: 16,
        }}>
          {message}
        </div>
      )}

      {/* Finnhub */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Finnhub</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Required for news feed. Get a free key at finnhub.io
        </p>
        <div className="form-group" style={{ marginBottom: 8 }}>
          <label className="form-label">API Key</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              type="password"
              placeholder="Enter Finnhub API key"
              value={finnhubApiKey}
              onChange={e => setFinnhubApiKey(e.target.value)}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => saveKey('finnhubApiKey', finnhubApiKey, 'Finnhub API key')}
              disabled={saving === 'finnhubApiKey'}
            >
              {saving === 'finnhubApiKey' ? '...' : 'Save'}
            </button>
          </div>
          {apiKeys.finnhubApiKey && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Current: {maskValue(apiKeys.finnhubApiKey)}
            </div>
          )}
        </div>
      </div>

      {/* Reddit */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Reddit</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Required for sentiment analysis. Create a Reddit app (script type) at reddit.com/prefs/apps
        </p>
        <div className="form-group">
          <label className="form-label">Client ID</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              type="password"
              placeholder="Enter Reddit Client ID"
              value={redditClientId}
              onChange={e => setRedditClientId(e.target.value)}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => saveKey('redditClientId', redditClientId, 'Reddit Client ID')}
              disabled={saving === 'redditClientId'}
            >
              {saving === 'redditClientId' ? '...' : 'Save'}
            </button>
          </div>
          {apiKeys.redditClientId && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Current: {maskValue(apiKeys.redditClientId)}
            </div>
          )}
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Client Secret</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              type="password"
              placeholder="Enter Reddit Client Secret"
              value={redditClientSecret}
              onChange={e => setRedditClientSecret(e.target.value)}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => saveKey('redditClientSecret', redditClientSecret, 'Reddit Client Secret')}
              disabled={saving === 'redditClientSecret'}
            >
              {saving === 'redditClientSecret' ? '...' : 'Save'}
            </button>
          </div>
          {apiKeys.redditClientSecret && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Current: {maskValue(apiKeys.redditClientSecret)}
            </div>
          )}
        </div>
      </div>

      {/* Cache */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Cache Management</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Clear cached market data, news, and sentiment to force fresh fetches
        </p>
        <button className="btn btn-danger btn-sm" onClick={handleClearCache}>
          Clear All Cache
        </button>
      </div>
    </div>
  );
}
