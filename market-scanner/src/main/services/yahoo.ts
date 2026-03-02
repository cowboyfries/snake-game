import yahooFinance from 'yahoo-finance2';
import type { PriceData, HistoricalDataPoint } from '../../shared/types';
import { getCachedPrice, setCachedPrice, getCachedHistorical, setCachedHistorical } from './cache';

export async function getStockPrice(symbol: string): Promise<PriceData> {
  const cached = getCachedPrice(symbol, 'stock');
  if (cached) return cached;

  const quote: any = await yahooFinance.quote(symbol);

  const priceData: PriceData = {
    symbol: quote.symbol,
    name: quote.shortName || quote.longName || quote.symbol,
    type: 'stock',
    price: quote.regularMarketPrice ?? 0,
    change24h: quote.regularMarketChange ?? 0,
    changePercent24h: quote.regularMarketChangePercent ?? 0,
    marketCap: quote.marketCap,
    volume24h: quote.regularMarketVolume,
    high24h: quote.regularMarketDayHigh,
    low24h: quote.regularMarketDayLow,
    lastUpdated: Date.now(),
  };

  setCachedPrice(symbol, 'stock', priceData);
  return priceData;
}

export async function getStockHistorical(symbol: string, days: number): Promise<HistoricalDataPoint[]> {
  const cached = getCachedHistorical(symbol, 'stock', days);
  if (cached) return cached;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result: any = await yahooFinance.chart(symbol, {
    period1: startDate,
    period2: endDate,
    interval: '1d',
  });

  const points: HistoricalDataPoint[] = (result.quotes || []).map((q: any) => ({
    timestamp: new Date(q.date).getTime(),
    open: q.open ?? 0,
    high: q.high ?? 0,
    low: q.low ?? 0,
    close: q.close ?? 0,
    volume: q.volume ?? 0,
  }));

  setCachedHistorical(symbol, 'stock', days, points);
  return points;
}
