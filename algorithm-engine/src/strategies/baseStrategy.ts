export abstract class BaseStrategy {
  name: string;
  indicator: string;

  constructor(name: string, indicator: string) {
    this.name = name;
    this.indicator = indicator;
  }

  abstract evaluate(candles: any[]): Promise<"BUY" | "SELL" | "HOLD">;
}
