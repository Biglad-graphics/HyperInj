const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  INJ: "injective-protocol",
  SOL: "solana",
  BNB: "binancecoin",
  ATOM: "cosmos",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  ARB: "arbitrum",
  OP: "optimism",
};

interface CacheEntry {
  price: number;
  change24h: number;
  ts: number;
}

// Module-level in-memory cache (survives across requests in the same serverless instance)
const cache: Record<string, CacheEntry> = {};
const TTL_MS = 20_000; // 20 seconds

export interface MarketData {
  price: number;
  change24h: number;
}

export async function getMarketData(symbol: string): Promise<MarketData> {
  const sym = symbol.toUpperCase();
  const hit = cache[sym];
  if (hit && Date.now() - hit.ts < TTL_MS) {
    return { price: hit.price, change24h: hit.change24h };
  }

  const id = COINGECKO_IDS[sym] ?? "injective-protocol";

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`,
      { cache: "no-store", signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const json = await res.json();
    const entry = json[id] ?? {};
    const price: number = entry.usd ?? 0;
    const change24h: number =
      Math.round((entry.usd_24h_change ?? 0) * 100) / 100;

    cache[sym] = { price, change24h, ts: Date.now() };
    return { price, change24h };
  } catch {
    // Return cached stale data if available, otherwise zeros
    return hit ? { price: hit.price, change24h: hit.change24h } : { price: 0, change24h: 0 };
  }
}
