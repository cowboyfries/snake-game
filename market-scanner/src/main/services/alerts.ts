import { BrowserWindow, Notification } from 'electron';
import { getDatabase } from '../db/database';
import type { Alert, AlertEvent, AlertSettings, AlertSound } from '../../shared/types';
import { getCryptoPrice } from './coingecko';
import { getStockPrice } from './yahoo';
import { getCryptoHistorical } from './coingecko';
import { getStockHistorical } from './yahoo';
import { calculateIndicators } from './indicators';
import { getSubredditMentions } from './reddit';
import { getCompanyNews } from './finnhub';

let checkInterval: ReturnType<typeof setInterval> | null = null;

function getAlertSettings(): AlertSettings {
  const db = getDatabase();
  const rows = db.prepare('SELECT key, value FROM alert_settings').all() as { key: string; value: string }[];
  const map = new Map(rows.map(r => [r.key, r.value]));

  return {
    soundEnabled: map.get('sound_enabled') !== 'false',
    defaultVolume: parseFloat(map.get('default_volume') || '0.7'),
    defaultSound: (map.get('default_sound') || 'default') as AlertSound,
    quietHoursStart: map.get('quiet_hours_start') || null,
    quietHoursEnd: map.get('quiet_hours_end') || null,
  };
}

function isQuietHours(settings: AlertSettings): boolean {
  if (!settings.quietHoursStart || !settings.quietHoursEnd) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
  const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Spans midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

function getWatchlistItemType(symbol: string): { type: 'stock' | 'crypto'; coingeckoId?: string } {
  const db = getDatabase();
  const row = db.prepare('SELECT type, coingecko_id FROM watchlist WHERE symbol = ?').get(symbol) as { type: string; coingecko_id: string | null } | undefined;
  if (row) {
    return { type: row.type as 'stock' | 'crypto', coingeckoId: row.coingecko_id || undefined };
  }
  // Default to stock if not in watchlist
  return { type: 'stock' };
}

async function checkAlert(alert: Alert): Promise<AlertEvent | null> {
  try {
    const { type, coingeckoId } = getWatchlistItemType(alert.symbol);
    let currentValue: number | null = null;
    let message = '';

    switch (alert.conditionType) {
      case 'price_above':
      case 'price_below': {
        const price = type === 'crypto'
          ? await getCryptoPrice(coingeckoId || alert.symbol.toLowerCase())
          : await getStockPrice(alert.symbol);
        currentValue = price.price;

        if (alert.conditionType === 'price_above' && currentValue > alert.threshold) {
          message = `${alert.symbol} price ($${currentValue.toFixed(2)}) is above $${alert.threshold.toFixed(2)}`;
        } else if (alert.conditionType === 'price_below' && currentValue < alert.threshold) {
          message = `${alert.symbol} price ($${currentValue.toFixed(2)}) is below $${alert.threshold.toFixed(2)}`;
        } else {
          return null;
        }
        break;
      }

      case 'rsi_above':
      case 'rsi_below': {
        const history = type === 'crypto'
          ? await getCryptoHistorical(coingeckoId || alert.symbol.toLowerCase(), 30)
          : await getStockHistorical(alert.symbol, 30);
        const indicators = calculateIndicators(history);
        if (indicators.rsi === null) return null;
        currentValue = indicators.rsi;

        if (alert.conditionType === 'rsi_above' && currentValue > alert.threshold) {
          message = `${alert.symbol} RSI (${currentValue.toFixed(1)}) is above ${alert.threshold}`;
        } else if (alert.conditionType === 'rsi_below' && currentValue < alert.threshold) {
          message = `${alert.symbol} RSI (${currentValue.toFixed(1)}) is below ${alert.threshold}`;
        } else {
          return null;
        }
        break;
      }

      case 'mention_spike': {
        const mentions = await getSubredditMentions(alert.symbol);
        currentValue = mentions.mentions;
        if (currentValue > alert.threshold) {
          message = `${alert.symbol} has ${currentValue} mentions (threshold: ${alert.threshold})`;
        } else {
          return null;
        }
        break;
      }

      case 'breaking_news': {
        const news = await getCompanyNews(alert.symbol);
        const lastCheck = alert.lastTriggered || alert.createdAt;
        const newArticles = news.filter(a => a.publishedAt > lastCheck);
        currentValue = newArticles.length;
        if (currentValue > 0) {
          message = `${alert.symbol}: ${currentValue} new article(s) — "${newArticles[0].headline}"`;
        } else {
          return null;
        }
        break;
      }
    }

    if (currentValue === null) return null;

    return {
      alertId: alert.id,
      symbol: alert.symbol,
      conditionType: alert.conditionType,
      threshold: alert.threshold,
      currentValue,
      sound: alert.sound,
      volume: alert.volume,
      message,
      triggeredAt: Date.now(),
    };
  } catch {
    return null;
  }
}

async function runAlertCheck(): Promise<void> {
  const db = getDatabase();
  const alerts = db.prepare('SELECT * FROM alerts WHERE enabled = 1').all() as Array<{
    id: number; symbol: string; condition_type: string; threshold: number;
    enabled: number; sound: string; volume: number; last_triggered: number | null; created_at: number;
  }>;

  const settings = getAlertSettings();
  const quiet = isQuietHours(settings);

  for (const row of alerts) {
    const alert: Alert = {
      id: row.id,
      symbol: row.symbol,
      conditionType: row.condition_type as Alert['conditionType'],
      threshold: row.threshold,
      enabled: true,
      sound: row.sound as AlertSound,
      volume: row.volume,
      lastTriggered: row.last_triggered,
      createdAt: row.created_at,
    };

    const event = await checkAlert(alert);
    if (!event) continue;

    // Update last_triggered
    db.prepare('UPDATE alerts SET last_triggered = ? WHERE id = ?').run(event.triggeredAt, alert.id);

    // Show native notification
    if (Notification.isSupported()) {
      const notif = new Notification({
        title: 'Market Scanner Alert',
        body: event.message,
      });
      notif.show();
    }

    // Send to renderer for toast + sound (unless quiet hours for sound)
    if (quiet) {
      event.sound = 'none';
    }
    if (!settings.soundEnabled) {
      event.sound = 'none';
    }

    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.webContents.send('alert:triggered', event);
    }
  }
}

export function startAlertEngine(): void {
  if (checkInterval) return;
  checkInterval = setInterval(runAlertCheck, 2 * 60 * 1000); // Every 2 minutes
}

export function stopAlertEngine(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}
