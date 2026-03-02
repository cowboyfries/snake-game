import { getDatabase } from '../db/database';
import type { PriceData, HistoricalDataPoint, SentimentData, NewsArticle } from '../../shared/types';

// TTL constants in milliseconds
const TTL = {
  CRYPTO_PRICE: 2 * 60 * 1000,      // 2 minutes
  STOCK_PRICE: 5 * 60 * 1000,       // 5 minutes
  SENTIMENT: 15 * 60 * 1000,        // 15 minutes
  NEWS: 10 * 60 * 1000,             // 10 minutes
  HISTORICAL: 60 * 60 * 1000,       // 1 hour
};

function isValid(timestamp: number, ttl: number): boolean {
  return (timestamp + ttl) > Date.now();
}

// Price cache
export function getCachedPrice(symbol: string, type: string): PriceData | null {
  const db = getDatabase();
  const row = db.prepare('SELECT data, timestamp FROM price_cache WHERE symbol = ? AND type = ?').get(symbol, type) as { data: string; timestamp: number } | undefined;
  if (!row) return null;
  const ttl = type === 'crypto' ? TTL.CRYPTO_PRICE : TTL.STOCK_PRICE;
  if (!isValid(row.timestamp, ttl)) return null;
  return JSON.parse(row.data);
}

export function setCachedPrice(symbol: string, type: string, data: PriceData): void {
  const db = getDatabase();
  db.prepare('INSERT OR REPLACE INTO price_cache (symbol, type, data, timestamp) VALUES (?, ?, ?, ?)').run(symbol, type, JSON.stringify(data), Date.now());
}

// Historical cache
export function getCachedHistorical(symbol: string, type: string, days: number): HistoricalDataPoint[] | null {
  const db = getDatabase();
  const row = db.prepare('SELECT data, timestamp FROM historical_cache WHERE symbol = ? AND type = ? AND days = ?').get(symbol, type, days) as { data: string; timestamp: number } | undefined;
  if (!row) return null;
  if (!isValid(row.timestamp, TTL.HISTORICAL)) return null;
  return JSON.parse(row.data);
}

export function setCachedHistorical(symbol: string, type: string, days: number, data: HistoricalDataPoint[]): void {
  const db = getDatabase();
  db.prepare('INSERT OR REPLACE INTO historical_cache (symbol, type, days, data, timestamp) VALUES (?, ?, ?, ?, ?)').run(symbol, type, days, JSON.stringify(data), Date.now());
}

// Sentiment cache
export function getCachedSentiment(symbol: string): SentimentData | null {
  const db = getDatabase();
  const row = db.prepare('SELECT data, timestamp FROM sentiment_cache WHERE symbol = ?').get(symbol) as { data: string; timestamp: number } | undefined;
  if (!row) return null;
  if (!isValid(row.timestamp, TTL.SENTIMENT)) return null;
  return JSON.parse(row.data);
}

export function setCachedSentiment(symbol: string, data: SentimentData): void {
  const db = getDatabase();
  db.prepare('INSERT OR REPLACE INTO sentiment_cache (symbol, data, timestamp) VALUES (?, ?, ?)').run(symbol, JSON.stringify(data), Date.now());
}

// News cache
export function getCachedNews(symbol: string | null): NewsArticle[] | null {
  const db = getDatabase();
  const key = symbol || '__general__';
  let rows: { data: string; timestamp: number }[];

  if (symbol) {
    rows = db.prepare('SELECT data, timestamp FROM news_cache WHERE symbol = ? ORDER BY published_at DESC LIMIT 20').all(symbol) as { data: string; timestamp: number }[];
  } else {
    rows = db.prepare('SELECT data, timestamp FROM news_cache WHERE symbol IS NULL OR symbol = ? ORDER BY published_at DESC LIMIT 30').all('__general__') as { data: string; timestamp: number }[];
  }

  if (rows.length === 0) return null;
  if (!isValid(rows[0].timestamp, TTL.NEWS)) return null;
  return rows.map(r => JSON.parse(r.data));
}

export function setCachedNews(articles: NewsArticle[], symbol: string | null): void {
  const db = getDatabase();
  const insert = db.prepare('INSERT OR REPLACE INTO news_cache (id, symbol, headline, summary, source, url, image_url, published_at, related_symbols, category, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const now = Date.now();
  const s = symbol || '__general__';

  const transaction = db.transaction(() => {
    for (const article of articles) {
      insert.run(article.id, s, article.headline, article.summary, article.source, article.url, article.imageUrl || null, article.publishedAt, JSON.stringify(article.relatedSymbols), article.category, now);
    }
  });
  transaction();
}

// Cleanup
export function cleanExpiredCache(): void {
  const db = getDatabase();
  const now = Date.now();
  db.prepare('DELETE FROM price_cache WHERE (timestamp + ?) < ?').run(TTL.STOCK_PRICE, now);
  db.prepare('DELETE FROM historical_cache WHERE (timestamp + ?) < ?').run(TTL.HISTORICAL, now);
  db.prepare('DELETE FROM sentiment_cache WHERE (timestamp + ?) < ?').run(TTL.SENTIMENT, now);
  db.prepare('DELETE FROM news_cache WHERE (timestamp + ?) < ?').run(TTL.NEWS, now);
}

export function clearAllCache(): void {
  const db = getDatabase();
  db.exec('DELETE FROM price_cache; DELETE FROM historical_cache; DELETE FROM sentiment_cache; DELETE FROM news_cache;');
}
