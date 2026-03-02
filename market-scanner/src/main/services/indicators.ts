import { RSI, MACD, SMA } from 'technicalindicators';
import type { HistoricalDataPoint, TechnicalIndicators } from '../../shared/types';

export function calculateIndicators(history: HistoricalDataPoint[]): TechnicalIndicators {
  const closes = history.map(p => p.close);

  // RSI (14-period)
  let rsi: number | null = null;
  if (closes.length >= 15) {
    const rsiValues = RSI.calculate({ values: closes, period: 14 });
    rsi = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : null;
  }

  // MACD (12, 26, 9)
  let macd: TechnicalIndicators['macd'] = null;
  if (closes.length >= 35) {
    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    const last = macdValues[macdValues.length - 1];
    if (last && last.MACD != null && last.signal != null && last.histogram != null) {
      macd = {
        macd: last.MACD,
        signal: last.signal,
        histogram: last.histogram,
      };
    }
  }

  // SMA 50
  let sma50: number | null = null;
  if (closes.length >= 50) {
    const sma50Values = SMA.calculate({ values: closes, period: 50 });
    sma50 = sma50Values.length > 0 ? sma50Values[sma50Values.length - 1] : null;
  }

  // SMA 200
  let sma200: number | null = null;
  if (closes.length >= 200) {
    const sma200Values = SMA.calculate({ values: closes, period: 200 });
    sma200 = sma200Values.length > 0 ? sma200Values[sma200Values.length - 1] : null;
  }

  return { rsi, macd, sma50, sma200 };
}
