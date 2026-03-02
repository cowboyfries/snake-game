import { useState, useEffect, useCallback } from 'react';
import type { Alert, AlertSettings, AlertSound } from '../../shared/types';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.api.getAlerts();
      setAlerts(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = useCallback(async (alert: {
    symbol: string; conditionType: string; threshold: number;
    enabled: boolean; sound: AlertSound; volume: number;
  }) => {
    try {
      const newAlert = await window.api.createAlert(alert as Omit<Alert, 'id' | 'lastTriggered' | 'createdAt'>);
      setAlerts(prev => [newAlert, ...prev]);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const update = useCallback(async (id: number, updates: Partial<Alert>) => {
    try {
      const updated = await window.api.updateAlert(id, updates);
      setAlerts(prev => prev.map(a => a.id === id ? updated : a));
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      await window.api.deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  return { alerts, loading, error, create, update, remove, refresh: fetch };
}

export function useAlertSettings() {
  const [settings, setSettings] = useState<AlertSettings>({
    soundEnabled: true,
    defaultVolume: 0.7,
    defaultSound: 'default',
    quietHoursStart: null,
    quietHoursEnd: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await window.api.getAlertSettings();
        setSettings(data);
      } catch { /* use defaults */ }
      setLoading(false);
    })();
  }, []);

  const update = useCallback(async (updates: Partial<AlertSettings>) => {
    try {
      const updated = await window.api.updateAlertSettings(updates);
      setSettings(updated);
    } catch { /* skip */ }
  }, []);

  return { settings, loading, update };
}
