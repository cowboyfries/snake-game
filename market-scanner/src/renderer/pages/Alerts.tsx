import React, { useState } from 'react';
import { useAlerts, useAlertSettings } from '../hooks/useAlerts';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import type { AlertCondition, AlertSound } from '../../shared/types';

const CONDITION_LABELS: Record<AlertCondition, string> = {
  price_above: 'Price Above',
  price_below: 'Price Below',
  rsi_above: 'RSI Above',
  rsi_below: 'RSI Below',
  mention_spike: 'Mention Spike',
  breaking_news: 'Breaking News',
};

const SOUND_OPTIONS: { value: AlertSound; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'none', label: 'No Sound' },
];

export default function Alerts() {
  const { alerts, loading, error, create, update, remove } = useAlerts();
  const { settings: alertSettings, update: updateSettings } = useAlertSettings();
  const [showForm, setShowForm] = useState(false);
  const [formSymbol, setFormSymbol] = useState('');
  const [formCondition, setFormCondition] = useState<AlertCondition>('price_above');
  const [formThreshold, setFormThreshold] = useState('');
  const [formSound, setFormSound] = useState<AlertSound>('default');
  const [formVolume, setFormVolume] = useState(0.7);

  const handleCreate = async () => {
    if (!formSymbol || !formThreshold) return;
    await create({
      symbol: formSymbol.toUpperCase(),
      conditionType: formCondition,
      threshold: parseFloat(formThreshold),
      enabled: true,
      sound: formSound,
      volume: formVolume,
    });
    setFormSymbol('');
    setFormThreshold('');
    setFormSound('default');
    setFormVolume(0.7);
    setShowForm(false);
  };

  const previewSound = (sound: AlertSound) => {
    if (sound === 'none') return;
    const paths: Record<string, string> = {
      default: 'alert-default.mp3',
      urgent: 'alert-urgent.mp3',
      success: 'alert-success.mp3',
      warning: 'alert-warning.mp3',
    };
    try {
      const audio = new Audio(`./sounds/${paths[sound]}`);
      audio.volume = formVolume;
      audio.play().catch(() => {});
    } catch { /* skip */ }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Alerts</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Create alert form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Create Alert</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Symbol</label>
                <input className="input" placeholder="e.g. AAPL, BTC" value={formSymbol} onChange={e => setFormSymbol(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Condition</label>
                <select className="select" style={{ width: '100%' }} value={formCondition} onChange={e => setFormCondition(e.target.value as AlertCondition)}>
                  {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Threshold</label>
                <input className="input" type="number" placeholder="Value" value={formThreshold} onChange={e => setFormThreshold(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Sound</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="select" style={{ flex: 1 }} value={formSound} onChange={e => setFormSound(e.target.value as AlertSound)}>
                    {SOUND_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button className="btn btn-ghost btn-sm" onClick={() => previewSound(formSound)} title="Preview sound">
                    ▶
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Volume: {Math.round(formVolume * 100)}%</label>
                <input type="range" min="0" max="1" step="0.05" value={formVolume} onChange={e => setFormVolume(parseFloat(e.target.value))} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleCreate} style={{ alignSelf: 'flex-start' }}>
              Create Alert
            </button>
          </div>
        </div>
      )}

      {/* Global alert settings */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Global Alert Settings</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sound</span>
            <label className="toggle">
              <input type="checkbox" checked={alertSettings.soundEnabled} onChange={e => updateSettings({ soundEnabled: e.target.checked })} />
              <span className="toggle-slider" />
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Volume</span>
            <input type="range" min="0" max="1" step="0.05" value={alertSettings.defaultVolume} onChange={e => updateSettings({ defaultVolume: parseFloat(e.target.value) })} style={{ width: 100 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{Math.round(alertSettings.defaultVolume * 100)}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Quiet Hours</span>
            <input className="input" type="time" style={{ width: 110 }} value={alertSettings.quietHoursStart || ''} onChange={e => updateSettings({ quietHoursStart: e.target.value || null })} />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <input className="input" type="time" style={{ width: 110 }} value={alertSettings.quietHoursEnd || ''} onChange={e => updateSettings({ quietHoursEnd: e.target.value || null })} />
          </div>
        </div>
      </div>

      {/* Alert list */}
      {loading ? (
        <LoadingSpinner />
      ) : alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
          <div style={{ fontSize: 16 }}>No alerts configured</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Create an alert to get notified about price changes and more</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Condition</th>
                <th>Threshold</th>
                <th>Sound</th>
                <th>Enabled</th>
                <th>Last Triggered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => (
                <tr key={alert.id} style={{ opacity: alert.enabled ? 1 : 0.5 }}>
                  <td style={{ fontWeight: 600 }}>{alert.symbol}</td>
                  <td>{CONDITION_LABELS[alert.conditionType] || alert.conditionType}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{alert.threshold}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {SOUND_OPTIONS.find(s => s.value === alert.sound)?.label || alert.sound}
                    {alert.sound !== 'none' && ` (${Math.round(alert.volume * 100)}%)`}
                  </td>
                  <td>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={alert.enabled}
                        onChange={e => update(alert.id, { enabled: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {alert.lastTriggered
                      ? new Date(alert.lastTriggered).toLocaleString()
                      : 'Never'}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(alert.id)}>
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
