import type { PriceData, HistoricalDataPoint } from '../../shared/types';
import { getCachedPrice, setCachedPrice, getCachedHistorical, setCachedHistorical } from './cache';

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

const limiter = new RateLimiter(25, 60000);
const BASE_URL = 'https://api.coingecko.com/api/v3';

async function fetchJson<T>(url: string): Promise<T> {
  await limiter.wait();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
}

export async function getCryptoPrices(ids: string[]): Promise<PriceData[]> {
  const results: PriceData[] = [];
  const uncached: string[] = [];

  for (const id of ids) {
    const cached = getCachedPrice(id, 'crypto');
    if (cached) {
      results.push(cached);
    } else {
      uncached.push(id);
    }
  }

  if (uncached.length > 0) {
    const data = await fetchJson<CoinMarketData[]>(
      `${BASE_URL}/coins/markets?vs_currency=usd&ids=${uncached.join(',')}&order=market_cap_desc&sparkline=false`
    );

    for (const coin of data) {
      const priceData: PriceData = {
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        type: 'crypto',
        price: coin.current_price,
        change24h: coin.price_change_24h,
        changePercent24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        lastUpdated: Date.now(),
      };
      setCachedPrice(coin.id, 'crypto', priceData);
      results.push(priceData);
    }
  }

  return results;
}

export async function getCryptoPrice(coingeckoId: string): Promise<PriceData> {
  const prices = await getCryptoPrices([coingeckoId]);
  if (prices.length === 0) throw new Error(`No data found for ${coingeckoId}`);
  return prices[0];
}

interface MarketChartResponse {
  prices: [number, number][];
}

export async function getCryptoHistorical(coingeckoId: string, days: number): Promise<HistoricalDataPoint[]> {
  const cached = getCachedHistorical(coingeckoId, 'crypto', days);
  if (cached) return cached;

  const data = await fetchJson<MarketChartResponse>(
    `${BASE_URL}/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
  );

  const points: HistoricalDataPoint[] = data.prices.map(([timestamp, price]) => ({
    timestamp,
    open: price,
    high: price,
    low: price,
    close: price,
    volume: 0,
  }));

  setCachedHistorical(coingeckoId, 'crypto', days, points);
  return points;
}
