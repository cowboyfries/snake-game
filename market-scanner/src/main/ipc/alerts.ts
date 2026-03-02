import { ipcMain } from 'electron';
import { getDatabase } from '../db/database';
import type { Alert, AlertSettings, AlertSound } from '../../shared/types';

export function registerAlertHandlers(): void {
  ipcMain.handle('alerts:getAll', async () => {
    try {
      const db = getDatabase();
      const rows = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all() as Array<{
        id: number; symbol: string; condition_type: string; threshold: number;
        enabled: number; sound: string; volume: number; last_triggered: number | null; created_at: number;
      }>;

      return rows.map(row => ({
        id: row.id,
        symbol: row.symbol,
        conditionType: row.condition_type,
        threshold: row.threshold,
        enabled: row.enabled === 1,
        sound: row.sound,
        volume: row.volume,
        lastTriggered: row.last_triggered,
        createdAt: row.created_at,
      })) as Alert[];
    } catch (err) {
      throw new Error(`Failed to get alerts: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('alerts:create', async (_event, alert: {
    symbol: string; conditionType: string; threshold: number;
    enabled: boolean; sound: string; volume: number;
  }) => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const result = db.prepare(
        'INSERT INTO alerts (symbol, condition_type, threshold, enabled, sound, volume, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(alert.symbol.toUpperCase(), alert.conditionType, alert.threshold, alert.enabled ? 1 : 0, alert.sound, alert.volume, now);

      return {
        id: result.lastInsertRowid as number,
        symbol: alert.symbol.toUpperCase(),
        conditionType: alert.conditionType,
        threshold: alert.threshold,
        enabled: alert.enabled,
        sound: alert.sound,
        volume: alert.volume,
        lastTriggered: null,
        createdAt: now,
      } as Alert;
    } catch (err) {
      throw new Error(`Failed to create alert: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('alerts:update', async (_event, id: number, updates: Partial<Alert>) => {
    try {
      const db = getDatabase();
      const sets: string[] = [];
      const values: (string | number)[] = [];

      if (updates.enabled !== undefined) { sets.push('enabled = ?'); values.push(updates.enabled ? 1 : 0); }
      if (updates.threshold !== undefined) { sets.push('threshold = ?'); values.push(updates.threshold); }
      if (updates.conditionType !== undefined) { sets.push('condition_type = ?'); values.push(updates.conditionType); }
      if (updates.sound !== undefined) { sets.push('sound = ?'); values.push(updates.sound); }
      if (updates.volume !== undefined) { sets.push('volume = ?'); values.push(updates.volume); }

      if (sets.length === 0) throw new Error('No updates provided');

      values.push(id);
      db.prepare(`UPDATE alerts SET ${sets.join(', ')} WHERE id = ?`).run(...values);

      const row = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as {
        id: number; symbol: string; condition_type: string; threshold: number;
        enabled: number; sound: string; volume: number; last_triggered: number | null; created_at: number;
      };

      return {
        id: row.id,
        symbol: row.symbol,
        conditionType: row.condition_type,
        threshold: row.threshold,
        enabled: row.enabled === 1,
        sound: row.sound,
        volume: row.volume,
        lastTriggered: row.last_triggered,
        createdAt: row.created_at,
      } as Alert;
    } catch (err) {
      throw new Error(`Failed to update alert: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('alerts:delete', async (_event, id: number) => {
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
    } catch (err) {
      throw new Error(`Failed to delete alert: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('alerts:getSettings', async () => {
    try {
      const db = getDatabase();
      const rows = db.prepare('SELECT key, value FROM alert_settings').all() as { key: string; value: string }[];
      const map = new Map(rows.map(r => [r.key, r.value]));

      return {
        soundEnabled: map.get('sound_enabled') !== 'false',
        defaultVolume: parseFloat(map.get('default_volume') || '0.7'),
        defaultSound: (map.get('default_sound') || 'default') as AlertSound,
        quietHoursStart: map.get('quiet_hours_start') || null,
        quietHoursEnd: map.get('quiet_hours_end') || null,
      } as AlertSettings;
    } catch (err) {
      throw new Error(`Failed to get alert settings: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('alerts:updateSettings', async (_event, settings: Partial<AlertSettings>) => {
    try {
      const db = getDatabase();
      const upsert = db.prepare('INSERT OR REPLACE INTO alert_settings (key, value) VALUES (?, ?)');

      const transaction = db.transaction(() => {
        if (settings.soundEnabled !== undefined) upsert.run('sound_enabled', String(settings.soundEnabled));
        if (settings.defaultVolume !== undefined) upsert.run('default_volume', String(settings.defaultVolume));
        if (settings.defaultSound !== undefined) upsert.run('default_sound', settings.defaultSound);
        if (settings.quietHoursStart !== undefined) upsert.run('quiet_hours_start', settings.quietHoursStart || '');
        if (settings.quietHoursEnd !== undefined) upsert.run('quiet_hours_end', settings.quietHoursEnd || '');
      });
      transaction();

      // Return updated settings
      const rows = db.prepare('SELECT key, value FROM alert_settings').all() as { key: string; value: string }[];
      const map = new Map(rows.map(r => [r.key, r.value]));

      return {
        soundEnabled: map.get('sound_enabled') !== 'false',
        defaultVolume: parseFloat(map.get('default_volume') || '0.7'),
        defaultSound: (map.get('default_sound') || 'default') as AlertSound,
        quietHoursStart: map.get('quiet_hours_start') || null,
        quietHoursEnd: map.get('quiet_hours_end') || null,
      } as AlertSettings;
    } catch (err) {
      throw new Error(`Failed to update alert settings: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('settings:setApiKey', async (_event, key: string, value: string) => {
    try {
      const db = getDatabase();
      db.prepare('INSERT OR REPLACE INTO api_keys (key, value) VALUES (?, ?)').run(key, value);
    } catch (err) {
      throw new Error(`Failed to set API key: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('settings:getApiKeys', async () => {
    try {
      const db = getDatabase();
      const rows = db.prepare('SELECT key, value FROM api_keys').all() as { key: string; value: string }[];
      const keys: Record<string, string> = {};
      for (const row of rows) {
        keys[row.key] = row.value;
      }
      return {
        redditClientId: keys.redditClientId,
        redditClientSecret: keys.redditClientSecret,
        finnhubApiKey: keys.finnhubApiKey,
      };
    } catch (err) {
      throw new Error(`Failed to get API keys: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('settings:clearCache', async () => {
    try {
      const { clearAllCache } = await import('../services/cache');
      clearAllCache();
    } catch (err) {
      throw new Error(`Failed to clear cache: ${(err as Error).message}`);
    }
  });
}
