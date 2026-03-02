import { getDatabase } from '../db/database';
import type { NewsArticle } from '../../shared/types';
import { getCachedNews, setCachedNews } from './cache';

class RateLimiter {
  private timestamps: number[] = [];
  constructor(private maxRequests: number, private windowMs: number) {}

  async wait(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxRequests) {
      const waitTime = this.timestamps[0] + this.windowMs - now;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.timestamps.push(Date.now());
  }
}

const limiter = new RateLimiter(50, 60000);

function getApiKey(): string | null {
  const db = getDatabase();
  const entry = db.data.apiKeys.find(e => e.key === 'finnhubApiKey');
  return entry?.value || null;
}

interface FinnhubNewsItem {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number;
  related: string;
  category: string;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function getCompanyNews(symbol: string): Promise<NewsArticle[]> {
  const cached = getCachedNews(symbol);
  if (cached) return cached;

  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Finnhub API key not configured. Add it in Settings.');

  await limiter.wait();

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);

  const res = await fetch(
    `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${formatDate(from)}&to=${formatDate(to)}&token=${apiKey}`
  );

  if (!res.ok) throw new Error(`Finnhub API error: ${res.status}`);
  const data = await res.json() as FinnhubNewsItem[];

  const articles: NewsArticle[] = data.slice(0, 20).map(item => ({
    id: String(item.id),
    headline: item.headline,
    summary: item.summary,
    source: item.source,
    url: item.url,
    imageUrl: item.image || undefined,
    publishedAt: item.datetime * 1000,
    relatedSymbols: item.related ? item.related.split(',').map(s => s.trim()) : [symbol],
    category: item.category,
  }));

  setCachedNews(articles, symbol);
  return articles;
}

export async function getGeneralMarketNews(): Promise<NewsArticle[]> {
  const cached = getCachedNews(null);
  if (cached) return cached;

  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Finnhub API key not configured. Add it in Settings.');

  await limiter.wait();

  const res = await fetch(
    `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`
  );

  if (!res.ok) throw new Error(`Finnhub API error: ${res.status}`);
  const data = await res.json() as FinnhubNewsItem[];

  const articles: NewsArticle[] = data.slice(0, 30).map(item => ({
    id: String(item.id),
    headline: item.headline,
    summary: item.summary,
    source: item.source,
    url: item.url,
    imageUrl: item.image || undefined,
    publishedAt: item.datetime * 1000,
    relatedSymbols: item.related ? item.related.split(',').map(s => s.trim()) : [],
    category: item.category,
  }));

  setCachedNews(articles, null);
  return articles;
}
