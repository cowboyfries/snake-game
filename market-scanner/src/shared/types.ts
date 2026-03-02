export type AssetType = 'stock' | 'crypto';

export interface PriceData {
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap?: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
  lastUpdated: number;
}

export interface HistoricalDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number | null;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  } | null;
  sma50: number | null;
  sma200: number | null;
}

export interface SentimentData {
  symbol: string;
  bullishPercent: number;
  bearishPercent: number;
  totalMentions: number;
  score: number; // -1 to 1
  sources: {
    reddit: { mentions: number; score: number };
    stocktwits: { mentions: number; bullish: number; bearish: number };
  };
  lastUpdated: number;
}

export interface TrendingAsset {
  symbol: string;
  name: string;
  type: AssetType;
  mentions: number;
  sentimentScore: number;
  price?: number;
  changePercent24h?: number;
}

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: number;
  relatedSymbols: string[];
  category: string;
}

export interface WatchlistItem {
  id: number;
  symbol: string;
  name: string;
  type: AssetType;
  coingeckoId?: string;
  addedAt: number;
}

export type AlertCondition =
  | 'price_above'
  | 'price_below'
  | 'rsi_above'
  | 'rsi_below'
  | 'mention_spike'
  | 'breaking_news';

export type AlertSound = 'default' | 'urgent' | 'success' | 'warning' | 'none';

export interface Alert {
  id: number;
  symbol: string;
  conditionType: AlertCondition;
  threshold: number;
  enabled: boolean;
  sound: AlertSound;
  volume: number;
  lastTriggered: number | null;
  createdAt: number;
}

export interface AlertEvent {
  alertId: number;
  symbol: string;
  conditionType: AlertCondition;
  threshold: number;
  currentValue: number;
  sound: AlertSound;
  volume: number;
  message: string;
  triggeredAt: number;
}

export interface AlertSettings {
  soundEnabled: boolean;
  defaultVolume: number;
  defaultSound: AlertSound;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export interface DashboardRow {
  watchlistItem: WatchlistItem;
  price: PriceData | null;
  indicators: TechnicalIndicators | null;
  sentiment: SentimentData | null;
  sparkline: number[];
}

export interface ApiKeys {
  redditClientId?: string;
  redditClientSecret?: string;
  finnhubApiKey?: string;
}

export interface MarketScannerAPI {
  // Market
  getPrice(symbol: string, type: AssetType, coingeckoId?: string): Promise<PriceData>;
  getPrices(items: { symbol: string; type: AssetType; coingeckoId?: string }[]): Promise<PriceData[]>;
  getHistorical(symbol: string, type: AssetType, days: number, coingeckoId?: string): Promise<HistoricalDataPoint[]>;
  getIndicators(symbol: string, type: AssetType, coingeckoId?: string): Promise<TechnicalIndicators>;

  // Dashboard
  getDashboard(): Promise<DashboardRow[]>;

  // Sentiment
  getSentiment(symbol: string): Promise<SentimentData>;
  getTrending(): Promise<TrendingAsset[]>;

  // News
  getNewsForSymbol(symbol: string): Promise<NewsArticle[]>;
  getGeneralNews(): Promise<NewsArticle[]>;

  // Watchlist
  getWatchlist(): Promise<WatchlistItem[]>;
  addToWatchlist(item: Omit<WatchlistItem, 'id' | 'addedAt'>): Promise<WatchlistItem>;
  removeFromWatchlist(id: number): Promise<void>;

  // Alerts
  getAlerts(): Promise<Alert[]>;
  createAlert(alert: Omit<Alert, 'id' | 'lastTriggered' | 'createdAt'>): Promise<Alert>;
  updateAlert(id: number, updates: Partial<Alert>): Promise<Alert>;
  deleteAlert(id: number): Promise<void>;
  getAlertSettings(): Promise<AlertSettings>;
  updateAlertSettings(settings: Partial<AlertSettings>): Promise<AlertSettings>;

  // Settings
  getApiKeys(): Promise<ApiKeys>;
  setApiKey(key: string, value: string): Promise<void>;
  clearCache(): Promise<void>;

  // Events
  onAlertTriggered(callback: (event: AlertEvent) => void): () => void;
  onPriceUpdate(callback: (prices: PriceData[]) => void): () => void;
}
