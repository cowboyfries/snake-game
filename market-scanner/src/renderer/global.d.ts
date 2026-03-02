import type { MarketScannerAPI } from '../shared/types';

declare global {
  interface Window {
    api: MarketScannerAPI;
  }
}
