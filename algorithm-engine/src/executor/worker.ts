import { getWorker } from '../config/index';
import { log } from '../utils/logger';
import { invokeAgenticServer } from '../ws/agenticServerClient';

interface ExecutionJobData {
  strategyId: string;
  userId: string;
  assetSymbol: string;
  timeframe: string;
  indicatorName: string;
  direction: "BUY" | "SELL";
}

export function startExecutionWorker() {
  const worker = getWorker(
    "execution",
    async (job: { data: ExecutionJobData }) => {
      const {
        strategyId,
        userId,
        assetSymbol,
        timeframe,
        indicatorName,
        direction,
      } = job.data;

      log(
        `⚡ Executing ${indicatorName} (${direction}) for ${assetSymbol} (${timeframe}) | strategyId=${strategyId} user=${userId}`
      );

      // 🔮 Invoke agentic server
      invokeAgenticServer(userId, strategyId, timeframe, assetSymbol, indicatorName, direction)
    }
  );

  log("🧠 Execution Worker running...");
}
