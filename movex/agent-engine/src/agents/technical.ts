import axios from 'axios';

export interface TechnicalSignal {
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number; // 0–1
  reasoning: string;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function sma(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function rsi(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function macd(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema = (arr: number[], p: number): number => {
    const k = 2 / (p + 1);
    return arr.reduce((prev, curr, i) => (i === 0 ? curr : curr * k + prev * (1 - k)));
  };
  const ema12 = ema(prices, 12);
  const ema26 = ema(prices, 26);
  const macdLine = ema12 - ema26;
  const signalLine = macdLine * (2 / 10); // simplified 9-period EMA
  return { macd: macdLine, signal: signalLine, histogram: macdLine - signalLine };
}

async function fetchCandles(symbol: string): Promise<Candle[]> {
  // Pull 1h candles from a public endpoint or Movement DEX subgraph.
  // Falls back to CoinGecko for major pairs in dev.
  try {
    const coinId = symbol.toLowerCase().replace('/usd', '').replace('-perp', '');
    const { data } = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=2`,
      { timeout: 5000 },
    );
    return data.map(([time, open, high, low, close]: number[]) => ({
      time, open, high, low, close, volume: 0,
    }));
  } catch {
    return [];
  }
}

export async function runTechnicalAgent(symbol: string): Promise<TechnicalSignal> {
  const candles = await fetchCandles(symbol);
  if (candles.length < 30) {
    return { symbol, direction: 'NEUTRAL', confidence: 0.3, reasoning: 'Insufficient candle data' };
  }

  const closes = candles.map(c => c.close);
  const rsiVal = rsi(closes);
  const macdVal = macd(closes);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const currentPrice = closes[closes.length - 1];

  const bullishSignals = [
    rsiVal < 40,                          // oversold
    macdVal.histogram > 0,                // bullish momentum
    currentPrice > sma20,                 // above short MA
    sma20 > sma50,                        // golden cross
  ].filter(Boolean).length;

  const bearishSignals = [
    rsiVal > 60,                          // overbought
    macdVal.histogram < 0,                // bearish momentum
    currentPrice < sma20,                 // below short MA
    sma20 < sma50,                        // death cross
  ].filter(Boolean).length;

  let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
  let confidence = 0.5;

  if (bullishSignals >= 3) { direction = 'LONG'; confidence = 0.5 + bullishSignals * 0.1; }
  else if (bearishSignals >= 3) { direction = 'SHORT'; confidence = 0.5 + bearishSignals * 0.1; }

  return {
    symbol,
    direction,
    confidence: Math.min(confidence, 0.95),
    reasoning: `RSI=${rsiVal.toFixed(1)}, MACD hist=${macdVal.histogram.toFixed(2)}, price vs SMA20=${((currentPrice/sma20 - 1)*100).toFixed(2)}%`,
  };
}
