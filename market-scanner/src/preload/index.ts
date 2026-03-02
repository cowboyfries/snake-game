import { contextBridge, ipcRenderer } from 'electron';
import type { MarketScannerAPI, AssetType, AlertEvent, PriceData, Alert, AlertSettings, WatchlistItem } from '../shared/types';

const api: MarketScannerAPI = {
  // Market
  getPrice: (symbol: string, type: AssetType, coingeckoId?: string) =>
    ipcRenderer.invoke('market:getPrice', symbol, type, coingeckoId),
  getPrices: (items: { symbol: string; type: AssetType; coingeckoId?: string }[]) =>
    ipcRenderer.invoke('market:getPrices', items),
  getHistorical: (symbol: string, type: AssetType, days: number, coingeckoId?: string) =>
    ipcRenderer.invoke('market:getHistorical', symbol, type, days, coingeckoId),
  getIndicators: (symbol: string, type: AssetType, coingeckoId?: string) =>
    ipcRenderer.invoke('market:getIndicators', symbol, type, coingeckoId),

  // Dashboard
  getDashboard: () => ipcRenderer.invoke('dashboard:getAll'),

  // Sentiment
  getSentiment: (symbol: string) => ipcRenderer.invoke('sentiment:get', symbol),
  getTrending: () => ipcRenderer.invoke('sentiment:trending'),

  // News
  getNewsForSymbol: (symbol: string) => ipcRenderer.invoke('news:getForSymbol', symbol),
  getGeneralNews: () => ipcRenderer.invoke('news:getGeneral'),

  // Watchlist
  getWatchlist: () => ipcRenderer.invoke('watchlist:getAll'),
  addToWatchlist: (item: Omit<WatchlistItem, 'id' | 'addedAt'>) =>
    ipcRenderer.invoke('watchlist:add', item),
  removeFromWatchlist: (id: number) => ipcRenderer.invoke('watchlist:remove', id),

  // Alerts
  getAlerts: () => ipcRenderer.invoke('alerts:getAll'),
  createAlert: (alert: Omit<Alert, 'id' | 'lastTriggered' | 'createdAt'>) =>
    ipcRenderer.invoke('alerts:create', alert),
  updateAlert: (id: number, updates: Partial<Alert>) =>
    ipcRenderer.invoke('alerts:update', id, updates),
  deleteAlert: (id: number) => ipcRenderer.invoke('alerts:delete', id),
  getAlertSettings: () => ipcRenderer.invoke('alerts:getSettings'),
  updateAlertSettings: (settings: Partial<AlertSettings>) =>
    ipcRenderer.invoke('alerts:updateSettings', settings),

  // Settings
  getApiKeys: () => ipcRenderer.invoke('settings:getApiKeys'),
  setApiKey: (key: string, value: string) => ipcRenderer.invoke('settings:setApiKey', key, value),
  clearCache: () => ipcRenderer.invoke('settings:clearCache'),

  // Events
  onAlertTriggered: (callback: (event: AlertEvent) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: AlertEvent) => callback(data);
    ipcRenderer.on('alert:triggered', handler);
    return () => ipcRenderer.removeListener('alert:triggered', handler);
  },
  onPriceUpdate: (callback: (prices: PriceData[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: PriceData[]) => callback(data);
    ipcRenderer.on('price:update', handler);
    return () => ipcRenderer.removeListener('price:update', handler);
  },
};

contextBridge.exposeInMainWorld('api', api);
