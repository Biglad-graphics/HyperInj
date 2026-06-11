import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const MOVEX_ADDR = process.env.MOVEX_ADDR ?? '';
const RPC_URL = process.env.MOVEMENT_RPC_URL ?? 'https://mainnet.movementnetwork.xyz/v1';

export function getAptosClient(): Aptos {
  const config = new AptosConfig({
    network: process.env.MOVEMENT_NETWORK === 'testnet' ? Network.TESTNET : Network.MAINNET,
    fullnode: RPC_URL,
  });
  return new Aptos(config);
}

export async function getMarkPrice(symbol: string): Promise<number> {
  const client = getAptosClient();
  try {
    const result = await client.view({
      payload: {
        function: `${MOVEX_ADDR}::market::get_mark_price`,
        typeArguments: [],
        functionArguments: [MOVEX_ADDR, Array.from(Buffer.from(symbol))],
      },
    });
    return Number(result[0]) / 1e8;
  } catch {
    return 0;
  }
}

export async function getFreeCollateral(userAddr: string): Promise<number> {
  const client = getAptosClient();
  try {
    const result = await client.view({
      payload: {
        function: `${MOVEX_ADDR}::vault::free_collateral`,
        typeArguments: [],
        functionArguments: [userAddr],
      },
    });
    return Number(result[0]) / 1e6;
  } catch {
    return 0;
  }
}

export interface PositionInfo {
  id: number;
  symbol: string;
  isLong: boolean;
  size: number;
  margin: number;
  entryPrice: number;
  pnl: number;
  markPrice: number;
}

export async function getUserPositions(_userAddr: string): Promise<PositionInfo[]> {
  // In production: query on-chain events / indexer for all open positions.
  // Returns hydrated position objects with current PnL.
  return [];
}
