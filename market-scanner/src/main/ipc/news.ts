import { ipcMain } from 'electron';
import { getCompanyNews, getGeneralMarketNews } from '../services/finnhub';

export function registerNewsHandlers(): void {
  ipcMain.handle('news:getForSymbol', async (_event, symbol: string) => {
    try {
      return await getCompanyNews(symbol);
    } catch (err) {
      throw new Error(`Failed to get news for ${symbol}: ${(err as Error).message}`);
    }
  });

  ipcMain.handle('news:getGeneral', async () => {
    try {
      return await getGeneralMarketNews();
    } catch (err) {
      throw new Error(`Failed to get general news: ${(err as Error).message}`);
    }
  });
}
