import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import { TradeSignal } from './consensus';

const MOVEX_ADDR = process.env.MOVEX_ADDR ?? '';
const MOVEMENT_NETWORK = process.env.MOVEMENT_NETWORK ?? 'mainnet';

function getClient(): Aptos {
  const config = new AptosConfig({
    network: MOVEMENT_NETWORK === 'testnet' ? Network.TESTNET : Network.MAINNET,
    fullnode: process.env.MOVEMENT_RPC_URL,
  });
  return new Aptos(config);
}

function getAgentAccount(): Account {
  const pk = process.env.AGENT_PRIVATE_KEY;
  if (!pk) throw new Error('AGENT_PRIVATE_KEY not set');
  return Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(pk) });
}

export interface ExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export async function executeSignal(
  signal: TradeSignal,
  availableMargin: number, // in USDCx micro-units
): Promise<ExecutionResult> {
  if (!signal.direction || signal.sizeFraction === 0) {
    return { success: false, error: 'No trade signal' };
  }

  const client = getClient();
  const agent = getAgentAccount();

  const margin = Math.floor(availableMargin * signal.sizeFraction);
  // 5x leverage by default — size = margin * 5
  const sizeUsd = margin * 5;

  if (margin < 1_000_000) { // min $1 USDC
    return { success: false, error: `Margin too small: ${margin}` };
  }

  try {
    const txn = await client.transaction.build.simple({
      sender: agent.accountAddress,
      data: {
        function: `${MOVEX_ADDR}::market::open_position`,
        typeArguments: [],
        functionArguments: [
          MOVEX_ADDR,
          Array.from(Buffer.from(signal.symbol)),
          signal.direction === 'LONG',
          sizeUsd,
          margin,
        ],
      },
    });

    const signed = await client.transaction.sign({ signer: agent, transaction: txn });
    const submitted = await client.transaction.submit.simple({ transaction: txn, senderAuthenticator: signed });
    const result = await client.waitForTransaction({ transactionHash: submitted.hash });

    console.log(`[Executor] Opened ${signal.direction} ${signal.symbol} | margin=${margin} | tx=${submitted.hash}`);
    return { success: true, txHash: submitted.hash };
  } catch (err: any) {
    console.error(`[Executor] Failed to open position: ${err.message}`);
    return { success: false, error: err.message };
  }
}

export async function closeSignal(
  symbol: string,
  protocolAddr: string,
): Promise<ExecutionResult> {
  const client = getClient();
  const agent = getAgentAccount();

  try {
    const txn = await client.transaction.build.simple({
      sender: agent.accountAddress,
      data: {
        function: `${MOVEX_ADDR}::market::close_position`,
        typeArguments: [],
        functionArguments: [protocolAddr, Array.from(Buffer.from(symbol))],
      },
    });

    const signed = await client.transaction.sign({ signer: agent, transaction: txn });
    const submitted = await client.transaction.submit.simple({ transaction: txn, senderAuthenticator: signed });
    await client.waitForTransaction({ transactionHash: submitted.hash });

    return { success: true, txHash: submitted.hash };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
