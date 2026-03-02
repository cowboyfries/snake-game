import { ipcMain } from 'electron';
import { getSubredditMentions } from '../services/reddit';
import { getStockTwitsSentiment } from '../services/stocktwits';
import { getCachedSentiment, setCachedSentiment } from '../services/cache';
import type { SentimentData, TrendingAsset } from '../../shared/types';

const TRENDING_SYMBOLS = {
  stocks: ['AAPL', 'TSLA', 'NVDA', 'AMD', 'AMZN', 'GOOGL', 'MSFT', 'META', 'GME', 'AMC'],
  crypto: ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'AVAX', 'MATIC', 'DOT', 'LINK'],
};

export function registerSentimentHandlers(): void {
  ipcMain.handle('sentiment:get', async (_event, symbol: string) => {
    try {
      const cached = getCachedSentiment(symbol);
      if (cached) return cached;

      const [reddit, stocktwits] = await Promise.allSettled([
        getSubredditMentions(symbol),
        getStockTwitsSentiment(symbol),
      ]);

      const redditData = reddit.status === 'fulfilled' ? reddit.value : { mentions: 0, score: 0 };
      const stData = stocktwits.status === 'fulfilled' ? stocktwits.value : { mentions: 0, bullish: 0, bearish: 0 };

      const totalMentions = redditData.mentions + stData.mentions;
      const bullish = stData.bullish;
      const bearish = stData.bearish;
      const totalSentiment = bullish + bearish;
      const bullishPercent = totalSentiment > 0 ? (bullish / totalSentiment) * 100 : 50;
      const bearishPercent = totalSentiment > 0 ? (bearish / totalSentiment) * 100 : 50;

      // Score: -1 (very bearish) to 1 (very bullish)
      const score = totalSentiment > 0 ? (bullish - bearish) / totalSentiment : 0;

      const sentiment: SentimentData = {
        symbol,
        bullishPercent,
        bearishPercent,
        totalMentions,
        score,
        sources: {
          reddit: { mentions: redditData.mentions, score: redditData.score },
          stocktwits: { mentions: stData.mentions, bullish: stData.bullish, bearish: stData.bearish },
        },
        lastUpdated: Date.now(),
      };

      setCachedSentiment(symbol, sentiment);
      return sentiment;
    } catch (err) {
      throw new Error(`Failed to get sentiment for ${symbol}: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('sentiment:trending', async () => {
    try {
      const allSymbols = [...TRENDING_SYMBOLS.stocks, ...TRENDING_SYMBOLS.crypto];
      const results: TrendingAsset[] = [];

      const sentimentResults = await Promise.allSettled(
        allSymbols.map(async (symbol) => {
          const cached = getCachedSentiment(symbol);
          if (cached) return { symbol, data: cached };

          const [stData] = await Promise.allSettled([
            getStockTwitsSentiment(symbol),
          ]);

          const st = stData.status === 'fulfilled' ? stData.value : { mentions: 0, bullish: 0, bearish: 0 };
          const totalSentiment = st.bullish + st.bearish;
          const score = totalSentiment > 0 ? (st.bullish - st.bearish) / totalSentiment : 0;

          return { symbol, data: { mentions: st.mentions, score } };
        })
      );

      for (const result of sentimentResults) {
        if (result.status !== 'fulfilled') continue;
        const { symbol, data } = result.value;

        const mentions = 'totalMentions' in data ? data.totalMentions : data.mentions;
        const score = 'score' in data ? data.score : 0;
        const isStock = TRENDING_SYMBOLS.stocks.includes(symbol);

        results.push({
          symbol,
          name: symbol,
          type: isStock ? 'stock' : 'crypto',
          mentions,
          sentimentScore: score,
        });
      }

      results.sort((a, b) => b.mentions - a.mentions);
      return results;
    } catch (err) {
      throw new Error(`Failed to get trending data: ${(err as Error).message}`);
    }
  });
}
