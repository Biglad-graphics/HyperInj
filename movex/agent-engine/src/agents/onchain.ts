import axios from 'axios';

export interface OnchainSignal {
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  reasoning: string;
}

const MOVEMENT_RPC = process.env.MOVEMENT_RPC_URL ?? 'https://mainnet.movementnetwork.xyz/v1';

interface FundingData {
  oi_long: number;
  oi_short: number;
  mark_price: number;
  funding_rate_bps: number;
}

async function fetchMarketData(symbol: string): Promise<FundingData | null> {
  try {
    // In production: query the movex::market view functions via Movement RPC
    const baseSymbol = symbol.replace('-PERP', '').replace('/USD', '');
    const { data } = await axios.post(
      `${MOVEMENT_RPC}`,
      {
        function: `${process.env.MOVEX_ADDR}::market::get_market_data`,
        type_arguments: [],
        arguments: [symbol],
      },
      { timeout: 5000 },
    );
    return data as FundingData;
  } catch {
    return null;
  }
}

export async function runOnchainAgent(symbol: string): Promise<OnchainSignal> {
  const data = await fetchMarketData(symbol);

  if (!data) {
    return {
      symbol,
      direction: 'NEUTRAL',
      confidence: 0.35,
      reasoning: 'On-chain data unavailable',
    };
  }

  const oiImbalance = data.oi_long / (data.oi_long + data.oi_short + 1);
  const fundingRate = data.funding_rate_bps;

  // High positive funding + OI skewed long → mean-reversion SHORT signal
  // High negative funding + OI skewed short → mean-reversion LONG signal
  let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
  let confidence = 0.5;

  if (oiImbalance > 0.65 && fundingRate > 50) {
    direction = 'SHORT';
    confidence = 0.55 + (oiImbalance - 0.65) * 0.5;
  } else if (oiImbalance < 0.35 && fundingRate < -50) {
    direction = 'LONG';
    confidence = 0.55 + (0.35 - oiImbalance) * 0.5;
  }

  return {
    symbol,
    direction,
    confidence: Math.min(confidence, 0.9),
    reasoning: `OI imbalance=${(oiImbalance * 100).toFixed(1)}% long, funding=${fundingRate}bps`,
  };
}
