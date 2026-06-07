import type { Candle } from '../types/index';
import { BaseStrategy } from './baseStrategy';

export class EmaCrossStrategy extends BaseStrategy {
  private shortPeriod: number;
  private longPeriod: number;
  private lastCrossoverIndex: number = -1;
  constructor(shortPeriod: number, longPeriod: number) {
    super(`EMA_CROSS_${shortPeriod}_${longPeriod}`, `EMA`);
    this.shortPeriod = shortPeriod;
    this.longPeriod = longPeriod;
  }

  private ema(values: number[], period: number): number {
    const k = 2 / (period + 1);
    let ema = values[0];
    for (let i = 1; i < values.length; i++) {
      ema = values[i] * k + ema * (1 - k);
    }
    return ema;
  }

  async evaluate(candles: Candle[]): Promise<"BUY" | "SELL" | "HOLD"> {
    console.log(candles.length)
    if (candles.length < this.longPeriod + 1) return "HOLD";

    const closes = candles.map(c => c.c);
    const lastIndex = candles.length - 1;

    // Compute EMAs for previous and current candles
    const emaShortPrev = this.ema(closes.slice(-(this.longPeriod + 1), -1), this.shortPeriod);
    const emaLongPrev = this.ema(closes.slice(-(this.longPeriod + 1), -1), this.longPeriod);

    const emaShortCurr = this.ema(closes.slice(-this.longPeriod), this.shortPeriod);
    const emaLongCurr = this.ema(closes.slice(-this.longPeriod), this.longPeriod);

    let signal: "BUY" | "SELL" | "HOLD" = "HOLD";

    // Detect new crossovers
    if (emaShortPrev <= emaLongPrev && emaShortCurr > emaLongCurr) {
      console.log("🚀 Golden Cross detected!");
      signal = "BUY";
    } else if (emaShortPrev >= emaLongPrev && emaShortCurr < emaLongCurr) {
      console.log("💀 Death Cross detected!");
      signal = "SELL";
    }

    // Only return a signal if it's new (not same index or same signal)
    if (
      signal !== "HOLD" &&
      (this.lastCrossoverIndex !== lastIndex)
    ) {
      this.lastCrossoverIndex = lastIndex;
      return signal;
    }

    return "HOLD";
  }
}
