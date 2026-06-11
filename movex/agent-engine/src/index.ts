import 'dotenv/config';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { runConsensus } from './consensus';
import { executeSignal } from './executor';

const SYMBOLS = ['BTC/USD-PERP', 'ETH/USD-PERP', 'MOVE/USD-PERP'];
const AGENT_CYCLE_MS = 60 * 60 * 1000; // run every hour

const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const agentQueue = new Queue('agent-cycle', { connection: redis });

const worker = new Worker(
  'agent-cycle',
  async (job) => {
    const { symbol, availableMargin } = job.data as { symbol: string; availableMargin: number };
    console.log(`[Agent] Running consensus for ${symbol}`);

    const signal = await runConsensus(symbol);
    console.log(`[Agent] ${symbol} → ${signal.direction ?? 'NO TRADE'} (conf=${signal.confidence.toFixed(2)})`);

    if (signal.direction) {
      const result = await executeSignal(signal, availableMargin);
      console.log(`[Agent] Execution: ${result.success ? result.txHash : result.error}`);
    }

    return signal;
  },
  { connection: redis, concurrency: 3 },
);

worker.on('completed', (job, result) => {
  console.log(`[Agent] Job ${job.id} completed: ${result.symbol} ${result.direction ?? 'NEUTRAL'}`);
});

worker.on('failed', (job, err) => {
  console.error(`[Agent] Job ${job?.id} failed: ${err.message}`);
});

// Schedule recurring cycles for each symbol
async function scheduleAll() {
  for (const symbol of SYMBOLS) {
    await agentQueue.add(
      'run',
      { symbol, availableMargin: parseInt(process.env.AGENT_MARGIN_USDC ?? '100000000') },
      {
        repeat: { every: AGENT_CYCLE_MS },
        removeOnComplete: 50,
        removeOnFail: 20,
      },
    );
  }
  console.log(`[Agent Engine] Scheduled cycles for: ${SYMBOLS.join(', ')}`);
}

scheduleAll().catch(console.error);
