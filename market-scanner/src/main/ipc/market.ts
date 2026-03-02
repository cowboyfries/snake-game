import { ipcMain } from 'electron';
import { getCryptoPrice, getCryptoPrices, getCryptoHistorical } from '../services/coingecko';
import { getStockPrice, getStockHistorical } from '../services/yahoo';
import { calculateIndicators } from '../services/indicators';
import type { AssetType, PriceData, HistoricalDataPoint, TechnicalIndicators, DashboardRow } from '../../shared/types';
import { getDatabase } from '../db/database';
import { getCachedSentiment } from '../services/cache';

export function registerMarketHandlers(): void {
  ipcMain.handle('market:getPrice', async (_event, symbol: string, type: AssetType, coingeckoId?: string) => {
    try {
      if (type === 'crypto') {
        return await getCryptoPrice(coingeckoId || symbol.toLowerCase());
      } else {
        return await getStockPrice(symbol);
      }
    } catch (err) {
      throw new Error(`Failed to get price for ${symbol}: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('market:getPrices', async (_event, items: { symbol: string; type: AssetType; coingeckoId?: string }[]) => {
    try {
      const cryptoItems = items.filter(i => i.type === 'crypto');
      const stockItems = items.filter(i => i.type === 'stock');

      const results: PriceData[] = [];

      if (cryptoItems.length > 0) {
        const ids = cryptoItems.map(i => i.coingeckoId || i.symbol.toLowerCase());
        const cryptoPrices = await getCryptoPrices(ids);
        results.push(...cryptoPrices);
      }

      const stockResults = await Promise.allSettled(
        stockItems.map(i => getStockPrice(i.symbol))
      );
      for (const r of stockResults) {
        if (r.status === 'fulfilled') results.push(r.value);
      }

      return results;
    } catch (err) {
      throw new Error(`Failed to get prices: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('market:getHistorical', async (_event, symbol: string, type: AssetType, days: number, coingeckoId?: string) => {
    try {
      if (type === 'crypto') {
        return await getCryptoHistorical(coingeckoId || symbol.toLowerCase(), days);
      } else {
        return await getStockHistorical(symbol, days);
      }
    } catch (err) {
      throw new Error(`Failed to get historical data for ${symbol}: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('market:getIndicators', async (_event, symbol: string, type: AssetType, coingeckoId?: string) => {
    try {
      let history: HistoricalDataPoint[];
      if (type === 'crypto') {
        history = await getCryptoHistorical(coingeckoId || symbol.toLowerCase(), 250);
      } else {
        history = await getStockHistorical(symbol, 250);
      }
      return calculateIndicators(history);
    } catch (err) {
      throw new Error(`Failed to get indicators for ${symbol}: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('dashboard:getAll', async () => {
    try {
      const db = getDatabase();
      const watchlistRows = db.prepare('SELECT * FROM watchlist ORDER BY added_at DESC').all() as Array<{
        id: number; symbol: string; name: string; type: string; coingecko_id: string | null; added_at: number;
      }>;

      const rows: DashboardRow[] = await Promise.all(
        watchlistRows.map(async (row) => {
          const item = {
            id: row.id,
            symbol: row.symbol,
            name: row.name,
            type: row.type as AssetType,
            coingeckoId: row.coingecko_id || undefined,
            addedAt: row.added_at,
          };

          const [priceResult, indicatorsResult, sentimentResult, historicalResult] = await Promise.allSettled([
            item.type === 'crypto'
              ? getCryptoPrice(item.coingeckoId || item.symbol.toLowerCase())
              : getStockPrice(item.symbol),
            (async () => {
              const hist = item.type === 'crypto'
                ? await getCryptoHistorical(item.coingeckoId || item.symbol.toLowerCase(), 250)
                : await getStockHistorical(item.symbol, 250);
              return calculateIndicators(hist);
            })(),
            Promise.resolve(getCachedSentiment(item.symbol)),
            (async () => {
              const hist = item.type === 'crypto'
                ? await getCryptoHistorical(item.coingeckoId || item.symbol.toLowerCase(), 7)
                : await getStockHistorical(item.symbol, 7);
              return hist.map(p => p.close);
            })(),
          ]);

          return {
            watchlistItem: item,
            price: priceResult.status === 'fulfilled' ? priceResult.value : null,
            indicators: indicatorsResult.status === 'fulfilled' ? indicatorsResult.value : null,
            sentiment: sentimentResult.status === 'fulfilled' ? sentimentResult.value : null,
            sparkline: historicalResult.status === 'fulfilled' ? historicalResult.value : [],
          };
        })
      );

      return rows;
    } catch (err) {
      throw new Error(`Failed to get dashboard data: ${(err as Error).message}`);
    }
  });
}
