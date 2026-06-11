import 'dotenv/config';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

const MOVEX_ADDR = process.env.MOVEX_ADDR ?? '';
const SCAN_INTERVAL_MS = 30_000; // scan every 30 seconds

function getClient(): Aptos {
  return new Aptos(new AptosConfig({
    network: process.env.MOVEMENT_NETWORK === 'testnet' ? Network.TESTNET : Network.MAINNET,
    fullnode: process.env.MOVEMENT_RPC_URL,
  }));
}

function getLiquidatorAccount(): Account {
  return Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(process.env.LIQUIDATOR_PRIVATE_KEY!),
  });
}

interface OpenPosition {
  owner: string;
  symbol: string;
  positionId: number;
  isLong: boolean;
  size: number;
  margin: number;
  entryPrice: number;
}

async function fetchAllOpenPositions(): Promise<OpenPosition[]> {
  // In production: query Movement indexer / subgraph for all open PositionOpenedEvent
  // minus PositionClosedEvent and LiquidatedEvent.
  // Skeleton implementation — hook into the indexer service in production.
  return [];
}

async function isLiquidatable(
  client: Aptos,
  pos: OpenPosition,
): Promise<boolean> {
  try {
    const priceResult = await client.view({
      payload: {
        function: `${MOVEX_ADDR}::market::get_mark_price`,
        typeArguments: [],
        functionArguments: [MOVEX_ADDR, Array.from(Buffer.from(pos.symbol))],
      },
    });
    const markPrice = Number(priceResult[0]);
    const entryPrice = pos.entryPrice;
    const pnl = pos.isLong
      ? ((markPrice - entryPrice) * pos.size) / entryPrice
      : ((entryPrice - markPrice) * pos.size) / entryPrice;

    const maintenanceMargin = pos.margin * 0.025; // 2.5%
    return pnl < 0 && Math.abs(pnl) >= pos.margin - maintenanceMargin;
  } catch {
    return false;
  }
}

async function liquidate(
  client: Aptos,
  liquidator: Account,
  pos: OpenPosition,
): Promise<void> {
  const txn = await client.transaction.build.simple({
    sender: liquidator.accountAddress,
    data: {
      function: `${MOVEX_ADDR}::market::liquidate`,
      typeArguments: [],
      functionArguments: [
        MOVEX_ADDR,
        pos.owner,
        Array.from(Buffer.from(pos.symbol)),
      ],
    },
  });
  const signed = await client.transaction.sign({ signer: liquidator, transaction: txn });
  const submitted = await client.transaction.submit.simple({ transaction: txn, senderAuthenticator: signed });
  await client.waitForTransaction({ transactionHash: submitted.hash });
  console.log(`[Liquidator] Liquidated ${pos.owner} ${pos.symbol} | tx=${submitted.hash}`);
}

async function scanAndLiquidate(): Promise<void> {
  const client = getClient();
  const liquidator = getLiquidatorAccount();
  const positions = await fetchAllOpenPositions();

  for (const pos of positions) {
    if (await isLiquidatable(client, pos)) {
      try {
        await liquidate(client, liquidator, pos);
      } catch (err: any) {
        console.error(`[Liquidator] Failed ${pos.owner}/${pos.symbol}: ${err.message}`);
      }
    }
  }
}

async function run(): Promise<void> {
  console.log('[Liquidation Bot] Starting...');
  while (true) {
    await scanAndLiquidate();
    await new Promise(r => setTimeout(r, SCAN_INTERVAL_MS));
  }
}

run().catch(console.error);
