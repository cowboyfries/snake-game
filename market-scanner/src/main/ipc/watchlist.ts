import { ipcMain } from 'electron';
import { getDatabase, nextId } from '../db/database';
import type { WatchlistItem } from '../../shared/types';

export function registerWatchlistHandlers(): void {
  ipcMain.handle('watchlist:getAll', async () => {
    try {
      const db = getDatabase();
      return db.data.watchlist
        .slice()
        .sort((a, b) => b.addedAt - a.addedAt)
        .map(row => ({
          id: row.id,
          symbol: row.symbol,
          name: row.name,
          type: row.type,
          coingeckoId: row.coingeckoId || undefined,
          addedAt: row.addedAt,
        })) as WatchlistItem[];
    } catch (err) {
      throw new Error(`Failed to get watchlist: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('watchlist:add', async (_event, item: { symbol: string; name: string; type: string; coingeckoId?: string }) => {
    try {
      const db = getDatabase();
      const symbol = item.symbol.toUpperCase();

      // Check for duplicates
      if (db.data.watchlist.some(w => w.symbol === symbol)) {
        throw new Error(`${symbol} is already in your watchlist`);
      }

      const now = Date.now();
      const id = nextId('watchlist');

      const entry = {
        id,
        symbol,
        name: item.name,
        type: item.type as 'stock' | 'crypto',
        coingeckoId: item.coingeckoId || null,
        addedAt: now,
      };

      db.data.watchlist.push(entry);
      db.write();

      return {
        id: entry.id,
        symbol: entry.symbol,
        name: entry.name,
        type: entry.type,
        coingeckoId: entry.coingeckoId || undefined,
        addedAt: now,
      } as WatchlistItem;
    } catch (err) {
      throw new Error(`Failed to add to watchlist: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('watchlist:remove', async (_event, id: number) => {
    try {
      const db = getDatabase();
      const idx = db.data.watchlist.findIndex(w => w.id === id);
      if (idx >= 0) {
        db.data.watchlist.splice(idx, 1);
        db.write();
      }
    } catch (err) {
      throw new Error(`Failed to remove from watchlist: ${(err as Error).message}`);
    }
  });
}
