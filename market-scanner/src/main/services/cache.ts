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
  const entry = db.data.priceCache.find(e => e.symbol === symbol && e.type === type);
  if (!entry) return null;
  const ttl = type === 'crypto' ? TTL.CRYPTO_PRICE : TTL.STOCK_PRICE;
  if (!isValid(entry.timestamp, ttl)) return null;
  return JSON.parse(entry.data);
}

export function setCachedPrice(symbol: string, type: string, data: PriceData): void {
  const db = getDatabase();
  const idx = db.data.priceCache.findIndex(e => e.symbol === symbol && e.type === type);
  const entry = { symbol, type, data: JSON.stringify(data), timestamp: Date.now() };
  if (idx >= 0) {
    db.data.priceCache[idx] = entry;
  } else {
    db.data.priceCache.push(entry);
  }
  db.write();
}

// Historical cache
export function getCachedHistorical(symbol: string, type: string, days: number): HistoricalDataPoint[] | null {
  const db = getDatabase();
  const entry = db.data.historicalCache.find(e => e.symbol === symbol && e.type === type && e.days === days);
  if (!entry) return null;
  if (!isValid(entry.timestamp, TTL.HISTORICAL)) return null;
  return JSON.parse(entry.data);
}

export function setCachedHistorical(symbol: string, type: string, days: number, data: HistoricalDataPoint[]): void {
  const db = getDatabase();
  const idx = db.data.historicalCache.findIndex(e => e.symbol === symbol && e.type === type && e.days === days);
  const entry = { symbol, type, days, data: JSON.stringify(data), timestamp: Date.now() };
  if (idx >= 0) {
    db.data.historicalCache[idx] = entry;
  } else {
    db.data.historicalCache.push(entry);
  }
  db.write();
}

// Sentiment cache
export function getCachedSentiment(symbol: string): SentimentData | null {
  const db = getDatabase();
  const entry = db.data.sentimentCache.find(e => e.symbol === symbol);
  if (!entry) return null;
  if (!isValid(entry.timestamp, TTL.SENTIMENT)) return null;
  return JSON.parse(entry.data);
}

export function setCachedSentiment(symbol: string, data: SentimentData): void {
  const db = getDatabase();
  const idx = db.data.sentimentCache.findIndex(e => e.symbol === symbol);
  const entry = { symbol, data: JSON.stringify(data), timestamp: Date.now() };
  if (idx >= 0) {
    db.data.sentimentCache[idx] = entry;
  } else {
    db.data.sentimentCache.push(entry);
  }
  db.write();
}

// News cache
export function getCachedNews(symbol: string | null): NewsArticle[] | null {
  const db = getDatabase();
  const key = symbol || '__general__';

  let entries: typeof db.data.newsCache;
  if (symbol) {
    entries = db.data.newsCache
      .filter(e => e.symbol === symbol)
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, 20);
  } else {
    entries = db.data.newsCache
      .filter(e => e.symbol === null || e.symbol === '__general__')
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, 30);
  }

  if (entries.length === 0) return null;
  if (!isValid(entries[0].timestamp, TTL.NEWS)) return null;

  return entries.map(e => ({
    id: e.id,
    headline: e.headline,
    summary: e.summary || '',
    source: e.source || '',
    url: e.url || '',
    imageUrl: e.imageUrl || undefined,
    publishedAt: e.publishedAt,
    relatedSymbols: JSON.parse(e.relatedSymbols),
    category: e.category || '',
  }));
}

export function setCachedNews(articles: NewsArticle[], symbol: string | null): void {
  const db = getDatabase();
  const s = symbol || '__general__';
  const now = Date.now();

  for (const article of articles) {
    const idx = db.data.newsCache.findIndex(e => e.id === article.id);
    const entry = {
      id: article.id,
      symbol: s,
      headline: article.headline,
      summary: article.summary,
      source: article.source,
      url: article.url,
      imageUrl: article.imageUrl || null,
      publishedAt: article.publishedAt,
      relatedSymbols: JSON.stringify(article.relatedSymbols),
      category: article.category,
      timestamp: now,
    };
    if (idx >= 0) {
      db.data.newsCache[idx] = entry;
    } else {
      db.data.newsCache.push(entry);
    }
  }
  db.write();
}

// Cleanup
export function cleanExpiredCache(): void {
  const db = getDatabase();
  const now = Date.now();
  db.data.priceCache = db.data.priceCache.filter(e => isValid(e.timestamp, TTL.STOCK_PRICE));
  db.data.historicalCache = db.data.historicalCache.filter(e => isValid(e.timestamp, TTL.HISTORICAL));
  db.data.sentimentCache = db.data.sentimentCache.filter(e => isValid(e.timestamp, TTL.SENTIMENT));
  db.data.newsCache = db.data.newsCache.filter(e => isValid(e.timestamp, TTL.NEWS));
  db.write();
}

export function clearAllCache(): void {
  const db = getDatabase();
  db.data.priceCache = [];
  db.data.historicalCache = [];
  db.data.sentimentCache = [];
  db.data.newsCache = [];
  db.write();
}
