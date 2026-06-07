import { pushCandle, getRecentCandles } from "../redis/candleStore";
import { EmaCrossStrategy } from "../strategies/emaCrossStrategy";
import { triggerQueue } from "../config/index";
import { log } from "../utils/logger";
import type { Candle } from "../types/index";
import { getUsersAndStrategiesByIndicator } from "../services/indicator";

const EMA_9_50_INDICATOR_ID = "690a5940d863d469e89f962f";
const strategyInstance = new EmaCrossStrategy(9, 50);

export async function handleCandleUpdate(candle: Candle) {
  const symbol = candle.s;
  const interval = candle.i;

  log(`📥 Received candle for ${symbol} (${interval})`);

  await pushCandle(symbol, interval, candle);
  const recentCandles = await getRecentCandles(symbol, interval);

  // Step 1️⃣ Evaluate the EMA strategy first
  const signal = await strategyInstance.evaluate(recentCandles);

  if (signal === "HOLD") return; // Nothing interesting happened

  log(`🚀 EMA ${strategyInstance.name} triggered ${signal} for ${symbol} (${interval})`);

  // Step 2️⃣ Now fetch users only if the strategy triggered
  const userStrategies = await getUsersAndStrategiesByIndicator(EMA_9_50_INDICATOR_ID);
  if (!userStrategies || userStrategies.length === 0) {
    log(`⚠️ No user strategies linked to indicator ${EMA_9_50_INDICATOR_ID}`);
    return;
  }

  // Step 3️⃣ Iterate through users and filter relevant ones
  for (const user of userStrategies) {
    const { userId, strategies: userStrats } = user;

    for (const strat of userStrats) {
      const hasIndicator = strat.indicators.some(
        (id: string) => id.toString() === EMA_9_50_INDICATOR_ID
      );

      if (
        strat.cryptoAsset === symbol &&
        strat.timeframe === interval &&
        hasIndicator
      ) {
        log(`📤 Queuing ${signal} for ${symbol} (${interval}) - user ${userId}`);

        await triggerQueue.add("trigger", {
          strategyId: strat._id,
          userId,
          assetSymbol: strat.cryptoAsset,
          timeframe: strat.timeframe,
          indicatorName: strategyInstance.indicator,
          direction: signal,
        });
      }
    }
  }
}
