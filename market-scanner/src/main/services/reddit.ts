import { getDatabase } from '../db/database';

class RateLimiter {
  private timestamps: number[] = [];
  constructor(private maxRequests: number, private windowMs: number) {}

  async wait(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxRequests) {
      const waitTime = this.timestamps[0] + this.windowMs - now;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.timestamps.push(Date.now());
  }
}

const limiter = new RateLimiter(50, 60000);

let accessToken: string | null = null;
let tokenExpiry = 0;

function getCredentials(): { clientId: string; clientSecret: string } | null {
  const db = getDatabase();
  const id = db.data.apiKeys.find(e => e.key === 'redditClientId');
  const secret = db.data.apiKeys.find(e => e.key === 'redditClientSecret');
  if (!id || !secret) return null;
  return { clientId: id.value, clientSecret: secret.value };
}

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const creds = getCredentials();
  if (!creds) throw new Error('Reddit API credentials not configured. Add them in Settings.');

  const auth = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'MarketScanner/1.0',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Reddit auth failed: ${res.status}`);
  const data = await res.json() as { access_token: string; expires_in: number };
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
  return accessToken;
}

const SUBREDDITS = ['wallstreetbets', 'stocks', 'CryptoMarkets', 'cryptocurrency'];

interface RedditSearchResult {
  data: {
    children: Array<{
      data: {
        title: string;
        selftext: string;
        score: number;
        num_comments: number;
        created_utc: number;
      };
    }>;
  };
}

export async function getSubredditMentions(symbol: string): Promise<{ mentions: number; score: number }> {
  const token = await getAccessToken();
  let totalMentions = 0;
  let totalScore = 0;

  for (const sub of SUBREDDITS) {
    await limiter.wait();
    try {
      const res = await fetch(
        `https://oauth.reddit.com/r/${sub}/search?q=${encodeURIComponent(symbol)}&restrict_sr=on&sort=new&t=day&limit=25`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'MarketScanner/1.0',
          },
        }
      );

      if (!res.ok) continue;
      const data = await res.json() as RedditSearchResult;

      for (const post of data.data.children) {
        const text = `${post.data.title} ${post.data.selftext}`.toUpperCase();
        if (text.includes(symbol.toUpperCase())) {
          totalMentions++;
          totalScore += post.data.score;
        }
      }
    } catch {
      // Skip failed subreddits
    }
  }

  return { mentions: totalMentions, score: totalScore };
}
