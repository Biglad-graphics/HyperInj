import { IndexerRestExplorerApi } from "@injectivelabs/sdk-ts";

const explorerApi = new IndexerRestExplorerApi(
  "https://sentry.lcd.injective.network/api/explorer/v1"
);

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface WalletActivity {
  txCount: number;
  lastActiveTimestamp: number | null; // unix ms
}

export async function fetchWalletActivity(
  address: string
): Promise<WalletActivity> {
  const sevenDaysAgo = Date.now() - SEVEN_DAYS_MS;

  const { transactions } = await explorerApi.fetchAccountTransactions({
    account: address,
    params: {
      limit: 50,
      startTime: Math.floor(sevenDaysAgo / 1000),
    },
  });

  const txCount = transactions.length;
  let lastActiveTimestamp: number | null = null;

  if (transactions.length > 0) {
    // blockTimestamp is ISO string e.g. "2024-01-15T10:30:00Z"
    const sorted = [...transactions].sort((a, b) => {
      const ta = new Date(a.blockTimestamp).getTime();
      const tb = new Date(b.blockTimestamp).getTime();
      return tb - ta;
    });
    const latest = sorted[0].blockTimestamp;
    lastActiveTimestamp = latest ? new Date(latest).getTime() : null;
  }

  return { txCount, lastActiveTimestamp };
}
