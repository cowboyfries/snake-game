interface StockTwitsResponse {
  response: { status: number };
  messages: Array<{
    id: number;
    body: string;
    created_at: string;
    entities: {
      sentiment?: {
        basic: 'Bullish' | 'Bearish' | null;
      };
    };
  }>;
}

export async function getStockTwitsSentiment(symbol: string): Promise<{
  mentions: number;
  bullish: number;
  bearish: number;
}> {
  const res = await fetch(
    `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(symbol)}.json`
  );

  if (!res.ok) {
    return { mentions: 0, bullish: 0, bearish: 0 };
  }

  const data = await res.json() as StockTwitsResponse;
  let bullish = 0;
  let bearish = 0;

  for (const msg of data.messages || []) {
    const sentiment = msg.entities?.sentiment?.basic;
    if (sentiment === 'Bullish') bullish++;
    else if (sentiment === 'Bearish') bearish++;
  }

  return {
    mentions: data.messages?.length || 0,
    bullish,
    bearish,
  };
}
