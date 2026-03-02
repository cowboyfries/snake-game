import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

// Schema for each "table" stored as arrays in JSON
export interface PriceCacheEntry {
  symbol: string;
  type: string;
  data: string;
  timestamp: number;
}

export interface HistoricalCacheEntry {
  symbol: string;
  type: string;
  days: number;
  data: string;
  timestamp: number;
}

export interface SentimentCacheEntry {
  symbol: string;
  data: string;
  timestamp: number;
}

export interface NewsCacheEntry {
  id: string;
  symbol: string | null;
  headline: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  imageUrl: string | null;
  publishedAt: number;
  relatedSymbols: string;
  category: string | null;
  timestamp: number;
}

export interface WatchlistEntry {
  id: number;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  coingeckoId: string | null;
  addedAt: number;
}

export interface AlertEntry {
  id: number;
  symbol: string;
  conditionType: string;
  threshold: number;
  enabled: boolean;
  sound: string;
  volume: number;
  lastTriggered: number | null;
  createdAt: number;
}

export interface ApiKeyEntry {
  key: string;
  value: string;
}

export interface AlertSettingEntry {
  key: string;
  value: string;
}

export interface DbSchema {
  priceCache: PriceCacheEntry[];
  historicalCache: HistoricalCacheEntry[];
  sentimentCache: SentimentCacheEntry[];
  newsCache: NewsCacheEntry[];
  watchlist: WatchlistEntry[];
  alerts: AlertEntry[];
  apiKeys: ApiKeyEntry[];
  alertSettings: AlertSettingEntry[];
  _counters: { watchlist: number; alerts: number };
}

const defaultData: DbSchema = {
  priceCache: [],
  historicalCache: [],
  sentimentCache: [],
  newsCache: [],
  watchlist: [],
  alerts: [],
  apiKeys: [],
  alertSettings: [],
  _counters: { watchlist: 0, alerts: 0 },
};

let db: LowSync<DbSchema> | null = null;

export function initDb(): void {
  const dbPath = path.join(app.getPath('userData'), 'market-scanner.json');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const adapter = new JSONFileSync<DbSchema>(dbPath);
  db = new LowSync<DbSchema>(adapter, defaultData);
  db.read();
}

export function getDatabase(): LowSync<DbSchema> {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.write();
    db = null;
  }
}

// Helper to generate auto-increment IDs
export function nextId(counter: 'watchlist' | 'alerts'): number {
  const d = getDatabase();
  d.data._counters[counter]++;
  return d.data._counters[counter];
}
