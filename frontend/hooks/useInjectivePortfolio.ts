import { useState, useEffect } from "react";
import { getUserPortfolio } from "../services/hyperliquidPortfolio.service";
import { getUserData } from "../utils/userStorage";

const INJ_DECIMALS = 1e18;
const USDT_DECIMALS = 1e6;
const USDT_DENOM = "peggy0xdAC17F958D2ee523a2206206994597C13D831ec7";
const USDC_DENOM = "peggy0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

async function fetchInjPrice(): Promise<{ price: number; change24h: number }> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=injective-protocol&vs_currencies=usd&include_24hr_change=true",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error("coingecko error");
    const json = await res.json();
    const entry = json["injective-protocol"] ?? {};
    return {
      price: entry.usd ?? 0,
      change24h: Math.round((entry.usd_24h_change ?? 0) * 100) / 100,
    };
  } catch {
    return { price: 0, change24h: 0 };
  }
}

export interface PortfolioState {
  injBalance: number;
  usdtBalance: number;
  injPriceUsd: number;
  injChange24h: number;
  totalValueUsd: number;
  loading: boolean;
  error: string | null;
  walletAddress: string | null;
}

export const useInjectivePortfolio = (): PortfolioState => {
  const [state, setState] = useState<PortfolioState>({
    injBalance: 0,
    usdtBalance: 0,
    injPriceUsd: 0,
    injChange24h: 0,
    totalValueUsd: 0,
    loading: false,
    error: null,
    walletAddress: null,
  });

  useEffect(() => {
    const userData = getUserData();
    if (!userData?.walletAddress) return;

    const injAddress = userData.walletAddress;

    const fetchData = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const [portfolio, { price, change24h }] = await Promise.all([
          getUserPortfolio(injAddress),
          fetchInjPrice(),
        ]);

        let injBalance = 0;
        let usdtBalance = 0;

        // Bank balances — INJ lives here
        for (const bal of portfolio?.bankBalancesList ?? []) {
          if (bal.denom === "inj") {
            injBalance += parseFloat(bal.amount) / INJ_DECIMALS;
          }
        }

        // Subaccount balances — USDT/USDC peggy tokens live here
        for (const sub of portfolio?.subaccountsList ?? []) {
          const total = parseFloat(sub.deposit?.totalBalance || "0");
          if (sub.denom === USDT_DENOM) {
            usdtBalance += total / USDT_DECIMALS;
          } else if (sub.denom === USDC_DENOM) {
            usdtBalance += total / USDT_DECIMALS;
          }
        }

        const totalValueUsd = injBalance * price + usdtBalance;

        setState({
          injBalance,
          usdtBalance,
          injPriceUsd: price,
          injChange24h: change24h,
          totalValueUsd,
          loading: false,
          error: null,
          walletAddress: injAddress,
        });
      } catch (err: any) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err?.message || "Failed to fetch portfolio",
        }));
      }
    };

    fetchData();
  }, []);

  return state;
};
