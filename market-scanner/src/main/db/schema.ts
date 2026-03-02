export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS price_cache (
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    PRIMARY KEY (symbol, type)
  );
  CREATE INDEX IF NOT EXISTS idx_price_cache_timestamp ON price_cache(timestamp);

  CREATE TABLE IF NOT EXISTS historical_cache (
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    days INTEGER NOT NULL,
    data TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    PRIMARY KEY (symbol, type, days)
  );
  CREATE INDEX IF NOT EXISTS idx_historical_cache_timestamp ON historical_cache(timestamp);

  CREATE TABLE IF NOT EXISTS sentiment_cache (
    symbol TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sentiment_cache_timestamp ON sentiment_cache(timestamp);

  CREATE TABLE IF NOT EXISTS news_cache (
    id TEXT PRIMARY KEY,
    symbol TEXT,
    headline TEXT NOT NULL,
    summary TEXT,
    source TEXT,
    url TEXT,
    image_url TEXT,
    published_at INTEGER NOT NULL,
    related_symbols TEXT,
    category TEXT,
    timestamp INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_news_cache_symbol ON news_cache(symbol);
  CREATE INDEX IF NOT EXISTS idx_news_cache_published_at ON news_cache(published_at);
  CREATE INDEX IF NOT EXISTS idx_news_cache_timestamp ON news_cache(timestamp);

  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('stock', 'crypto')),
    coingecko_id TEXT,
    added_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    condition_type TEXT NOT NULL,
    threshold REAL NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    sound TEXT NOT NULL DEFAULT 'default',
    volume REAL NOT NULL DEFAULT 0.7,
    last_triggered INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alert_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;
