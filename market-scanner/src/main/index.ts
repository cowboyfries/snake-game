import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { initDb, getDatabase, closeDatabase } from './db/database';
import { registerMarketHandlers } from './ipc/market';
import { registerSentimentHandlers } from './ipc/sentiment';
import { registerNewsHandlers } from './ipc/news';
import { registerWatchlistHandlers } from './ipc/watchlist';
import { registerAlertHandlers } from './ipc/alerts';
import { startAlertEngine, stopAlertEngine } from './services/alerts';
import { cleanExpiredCache } from './services/cache';
import { getCryptoPrices } from './services/coingecko';
import { getStockPrice } from './services/yahoo';

if (started) {
  app.quit();
}

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;
let cacheCleanupInterval: ReturnType<typeof setInterval> | null = null;
let priceRefreshInterval: ReturnType<typeof setInterval> | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function pushPriceUpdates(): Promise<void> {
  if (!mainWindow) return;

  try {
    const db = getDatabase();
    const watchlistRows = db.data.watchlist;

    if (watchlistRows.length === 0) return;

    const cryptoItems = watchlistRows.filter(r => r.type === 'crypto');
    const stockItems = watchlistRows.filter(r => r.type === 'stock');

    const prices = [];

    if (cryptoItems.length > 0) {
      const ids = cryptoItems.map(r => r.coingeckoId || r.symbol.toLowerCase());
      try {
        const cryptoPrices = await getCryptoPrices(ids);
        prices.push(...cryptoPrices);
      } catch { /* skip */ }
    }

    for (const item of stockItems) {
      try {
        const price = await getStockPrice(item.symbol);
        prices.push(price);
      } catch { /* skip */ }
    }

    if (prices.length > 0 && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('price:update', prices);
    }
  } catch { /* skip */ }
}

app.whenReady().then(async () => {
  // Initialize database (lowdb JSON file)
  initDb();

  // Register all IPC handlers
  registerMarketHandlers();
  registerSentimentHandlers();
  registerNewsHandlers();
  registerWatchlistHandlers();
  registerAlertHandlers();

  // Create window
  createWindow();

  // Start alert engine
  startAlertEngine();

  // Periodic cache cleanup (every 5 minutes)
  cacheCleanupInterval = setInterval(cleanExpiredCache, 5 * 60 * 1000);

  // Periodic price push (every 60 seconds)
  priceRefreshInterval = setInterval(pushPriceUpdates, 60 * 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopAlertEngine();

  if (cacheCleanupInterval) clearInterval(cacheCleanupInterval);
  if (priceRefreshInterval) clearInterval(priceRefreshInterval);

  closeDatabase();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
