import { ipcMain } from 'electron';
import { getDatabase, nextId } from '../db/database';
import type { Alert, AlertSettings, AlertSound } from '../../shared/types';

export function registerAlertHandlers(): void {
  ipcMain.handle('alerts:getAll', async () => {
    try {
      const db = getDatabase();
      return db.data.alerts
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(row => ({
          id: row.id,
          symbol: row.symbol,
          conditionType: row.conditionType,
          threshold: row.threshold,
          enabled: row.enabled,
          sound: row.sound,
          volume: row.volume,
          lastTriggered: row.lastTriggered,
          createdAt: row.createdAt,
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
      const id = nextId('alerts');

      const entry = {
        id,
        symbol: alert.symbol.toUpperCase(),
        conditionType: alert.conditionType,
        threshold: alert.threshold,
        enabled: alert.enabled,
        sound: alert.sound,
        volume: alert.volume,
        lastTriggered: null as number | null,
        createdAt: now,
      };

      db.data.alerts.push(entry);
      db.write();

      return {
        id: entry.id,
        symbol: entry.symbol,
        conditionType: entry.conditionType,
        threshold: entry.threshold,
        enabled: entry.enabled,
        sound: entry.sound,
        volume: entry.volume,
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
      const idx = db.data.alerts.findIndex(a => a.id === id);
      if (idx < 0) throw new Error('Alert not found');

      const row = db.data.alerts[idx];
      if (updates.enabled !== undefined) row.enabled = updates.enabled;
      if (updates.threshold !== undefined) row.threshold = updates.threshold;
      if (updates.conditionType !== undefined) row.conditionType = updates.conditionType;
      if (updates.sound !== undefined) row.sound = updates.sound;
      if (updates.volume !== undefined) row.volume = updates.volume;

      db.write();

      return {
        id: row.id,
        symbol: row.symbol,
        conditionType: row.conditionType,
        threshold: row.threshold,
        enabled: row.enabled,
        sound: row.sound,
        volume: row.volume,
        lastTriggered: row.lastTriggered,
        createdAt: row.createdAt,
      } as Alert;
    } catch (err) {
      throw new Error(`Failed to update alert: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('alerts:delete', async (_event, id: number) => {
    try {
      const db = getDatabase();
      const idx = db.data.alerts.findIndex(a => a.id === id);
      if (idx >= 0) {
        db.data.alerts.splice(idx, 1);
        db.write();
      }
    } catch (err) {
      throw new Error(`Failed to delete alert: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('alerts:getSettings', async () => {
    try {
      const db = getDatabase();
      const map = new Map(db.data.alertSettings.map(r => [r.key, r.value]));

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

      function upsert(key: string, value: string) {
        const idx = db.data.alertSettings.findIndex(e => e.key === key);
        if (idx >= 0) {
          db.data.alertSettings[idx].value = value;
        } else {
          db.data.alertSettings.push({ key, value });
        }
      }

      if (settings.soundEnabled !== undefined) upsert('sound_enabled', String(settings.soundEnabled));
      if (settings.defaultVolume !== undefined) upsert('default_volume', String(settings.defaultVolume));
      if (settings.defaultSound !== undefined) upsert('default_sound', settings.defaultSound);
      if (settings.quietHoursStart !== undefined) upsert('quiet_hours_start', settings.quietHoursStart || '');
      if (settings.quietHoursEnd !== undefined) upsert('quiet_hours_end', settings.quietHoursEnd || '');

      db.write();

      // Return updated settings
      const map = new Map(db.data.alertSettings.map(r => [r.key, r.value]));

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
      const idx = db.data.apiKeys.findIndex(e => e.key === key);
      if (idx >= 0) {
        db.data.apiKeys[idx].value = value;
      } else {
        db.data.apiKeys.push({ key, value });
      }
      db.write();
    } catch (err) {
      throw new Error(`Failed to set API key: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('settings:getApiKeys', async () => {
    try {
      const db = getDatabase();
      const keys: Record<string, string> = {};
      for (const row of db.data.apiKeys) {
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
