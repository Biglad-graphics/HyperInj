import { redis } from '../config/index';
import type { Candle } from '../types/index';
import { log } from "../utils/logger";

export async function pushCandle(symbol: string, interval: string, candle: Candle) {
  const key = `candle:${symbol}:${interval}`;

  try {
    const currentT = Number(candle.t);
    const lastRaw = await redis.lindex(key, -1);

    if (lastRaw) {
      const lastCandle: Candle = JSON.parse(lastRaw);
      const lastT = Number(lastCandle.t);

      if (lastT === currentT) {
        await redis.lset(key, -1, JSON.stringify(candle));
        return;
      }
    }

    await redis.rpush(key, JSON.stringify(candle));
    await redis.ltrim(key, -2016, -1);
  } catch (error) {
    log(`❌ Error in pushCandle for ${symbol} ${interval}: ${error}`);
  }
}

export async function getRecentCandles(symbol: string, interval: string, n = 100) {
  const key = `candle:${symbol}:${interval}`;
  try {
    const data = await redis.lrange(key, -n, -1);
    return data.map((item) => JSON.parse(item));
  } catch (error) {
    log(`❌ Error in getRecentCandles for ${symbol} ${interval}: ${error}`);
    return [];
  }
}
