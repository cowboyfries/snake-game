import { ipcMain } from 'electron';
import { getDatabase } from '../db/database';
import type { WatchlistItem } from '../../shared/types';

export function registerWatchlistHandlers(): void {
  ipcMain.handle('watchlist:getAll', async () => {
    try {
      const db = getDatabase();
      const rows = db.prepare('SELECT * FROM watchlist ORDER BY added_at DESC').all() as Array<{
        id: number; symbol: string; name: string; type: string; coingecko_id: string | null; added_at: number;
      }>;

      return rows.map(row => ({
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        type: row.type,
        coingeckoId: row.coingecko_id || undefined,
        addedAt: row.added_at,
      })) as WatchlistItem[];
    } catch (err) {
      throw new Error(`Failed to get watchlist: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('watchlist:add', async (_event, item: { symbol: string; name: string; type: string; coingeckoId?: string }) => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const result = db.prepare(
        'INSERT INTO watchlist (symbol, name, type, coingecko_id, added_at) VALUES (?, ?, ?, ?, ?)'
      ).run(item.symbol.toUpperCase(), item.name, item.type, item.coingeckoId || null, now);

      return {
        id: result.lastInsertRowid as number,
        symbol: item.symbol.toUpperCase(),
        name: item.name,
        type: item.type,
        coingeckoId: item.coingeckoId,
        addedAt: now,
      } as WatchlistItem;
    } catch (err) {
      if ((err as Error).message.includes('UNIQUE')) {
        throw new Error(`${item.symbol} is already in your watchlist`);
      }
      throw new Error(`Failed to add to watchlist: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('watchlist:remove', async (_event, id: number) => {
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM watchlist WHERE id = ?').run(id);
    } catch (err) {
      throw new Error(`Failed to remove from watchlist: ${(err as Error).message}`);
    }
  });
}
