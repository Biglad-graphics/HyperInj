import { startHyperliquidFeed } from './ws/hyperliquidClient';
import { startExecutionWorker } from './executor/worker';
import { startAgenticWebSocket } from './ws/agenticServerClient';
import dotenv from "dotenv";

async function main() {
  dotenv.config();
  startHyperliquidFeed();
  startAgenticWebSocket();
  startExecutionWorker();
}

main();
