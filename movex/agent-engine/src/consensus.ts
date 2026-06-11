import { TechnicalSignal, runTechnicalAgent } from './agents/technical';
import { SentimentSignal, runSentimentAgent } from './agents/sentiment';
import { OnchainSignal, runOnchainAgent } from './agents/onchain';

export interface TradeSignal {
  symbol: string;
  direction: 'LONG' | 'SHORT' | null;
  confidence: number;
  sizeFraction: number; // 0–1, fraction of available margin to use
  agents: {
    technical: TechnicalSignal;
    sentiment: SentimentSignal;
    onchain: OnchainSignal;
  };
}

// Agent weights — technical carries most weight
const WEIGHTS = { technical: 0.45, sentiment: 0.30, onchain: 0.25 };
const MIN_CONFIDENCE = 0.62;   // minimum weighted confidence to trade
const MIN_AGENTS_AGREE = 2;    // at least 2 of 3 must point same direction

export async function runConsensus(symbol: string): Promise<TradeSignal> {
  const [technical, sentiment, onchain] = await Promise.all([
    runTechnicalAgent(symbol),
    runSentimentAgent(symbol),
    runOnchainAgent(symbol),
  ]);

  const agents = [
    { signal: technical,  weight: WEIGHTS.technical },
    { signal: sentiment,  weight: WEIGHTS.sentiment },
    { signal: onchain,    weight: WEIGHTS.onchain },
  ];

  // Weighted score: +1 for LONG, -1 for SHORT, 0 for NEUTRAL
  let weightedScore = 0;
  let weightedConfidence = 0;
  let longVotes = 0, shortVotes = 0;

  for (const { signal, weight } of agents) {
    const dirScore = signal.direction === 'LONG' ? 1 : signal.direction === 'SHORT' ? -1 : 0;
    weightedScore += dirScore * weight * signal.confidence;
    weightedConfidence += signal.confidence * weight;
    if (signal.direction === 'LONG') longVotes++;
    if (signal.direction === 'SHORT') shortVotes++;
  }

  const direction: 'LONG' | 'SHORT' | null =
    longVotes >= MIN_AGENTS_AGREE && weightedScore > 0 ? 'LONG' :
    shortVotes >= MIN_AGENTS_AGREE && weightedScore < 0 ? 'SHORT' :
    null;

  // Size scales with confidence: 25–75% of available margin
  const sizeFraction = direction && weightedConfidence >= MIN_CONFIDENCE
    ? 0.25 + (weightedConfidence - MIN_CONFIDENCE) * 0.5
    : 0;

  return {
    symbol,
    direction: weightedConfidence >= MIN_CONFIDENCE ? direction : null,
    confidence: weightedConfidence,
    sizeFraction: Math.min(sizeFraction, 0.75),
    agents: { technical, sentiment, onchain },
  };
}
