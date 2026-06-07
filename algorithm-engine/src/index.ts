import { startInjectiveFeed } from './ws/injectiveClient';
import { startExecutionWorker } from './executor/worker';
import { startAgenticWebSocket } from './ws/agenticServerClient';
import dotenv from "dotenv";

async function main() {
  dotenv.config();
  startInjectiveFeed();
  startAgenticWebSocket();
  startExecutionWorker();
}

main();
